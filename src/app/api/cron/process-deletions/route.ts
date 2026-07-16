import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.historydrift.com";
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron or an authorised source
  const auth = req.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  let warned = 0, deleted = 0;

  // ── 1. Send 14-day warning emails ──────────────────────────────────
  const { data: toWarn } = await supabase
    .from("user_deletion_schedule")
    .select("id, user_id, scheduled_for")
    .is("warning_sent_at", null)
    .is("deleted_at", null)
    .lte("scheduled_for", in14Days.toISOString());

  for (const row of toWarn ?? []) {
    const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
    const user = userData?.user;
    if (!user?.email) continue;

    const deleteDate = new Date(row.scheduled_for).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });

    await resend.emails.send({
      from: "History Drift <noreply@historydrift.com>",
      to: user.email,
      subject: "Important: Your History Drift data will be deleted in 14 days",
      text: `Your History Drift subscription has ended. All your personal data — interviews, storyboards, family memories, and account information — will be permanently deleted on ${deleteDate}.\n\nTo keep your data, reactivate your subscription before that date at ${APP_URL}/settings.\n\nIf you believe this is an error, contact us at support@historydrift.com.`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1208;background:#fdf8f2;padding:40px 32px;">
          <div style="font-size:13px;color:#8a6830;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">History Drift</div>
          <h1 style="font-size:22px;font-weight:bold;color:#8a1a1a;margin:0 0 16px;">Your data will be deleted in 14 days</h1>
          <p style="font-size:15px;line-height:1.7;color:#3a2a10;margin:0 0 16px;">
            Your History Drift subscription has ended. As per our data retention policy, all your personal data will be <strong>permanently deleted on ${deleteDate}</strong>.
          </p>
          <p style="font-size:14px;line-height:1.7;color:#3a2a10;margin:0 0 24px;">This includes:</p>
          <ul style="font-size:14px;line-height:1.8;color:#5a3a10;margin:0 0 24px;padding-left:20px;">
            <li>All interview sessions and answers</li>
            <li>Re-Live storyboards</li>
            <li>Family memories and contributions</li>
            <li>Biography, timeline, and legacy documents</li>
            <li>Your account and profile information</li>
          </ul>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background-color:#7a2d8a;border-radius:10px;padding:14px 28px;">
                <a href="${APP_URL}/settings" style="color:white;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">Reactivate my subscription →</a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#9a7a50;line-height:1.6;border-top:1px solid #e8d8b8;padding-top:20px;margin:0;">
            If you believe this is an error or need help, contact us at <a href="mailto:support@historydrift.com" style="color:#7a2d8a;">support@historydrift.com</a>.
          </p>
        </div>
      `,
    });

    await supabase
      .from("user_deletion_schedule")
      .update({ warning_sent_at: now.toISOString() })
      .eq("id", row.id);

    warned++;
  }

  // ── 2. Permanently delete overdue accounts ──────────────────────────
  const { data: toDelete } = await supabase
    .from("user_deletion_schedule")
    .select("id, user_id")
    .is("deleted_at", null)
    .lte("scheduled_for", now.toISOString());

  for (const row of toDelete ?? []) {
    const uid = row.user_id;

    // Delete all user data tables (cascades handle most, but be explicit)
    await supabase.from("interview_exchanges").delete().eq("user_id", uid);
    await supabase.from("interview_sessions").delete().eq("user_id", uid);
    await supabase.from("relive_storyboards").delete().eq("user_id", uid);
    await supabase.from("family_invites").delete().eq("user_id", uid);

    // Delete storage files
    const { data: files } = await supabase.storage
      .from("family-photos")
      .list(uid);
    if (files?.length) {
      await supabase.storage
        .from("family-photos")
        .remove(files.map((f: { name: string }) => `${uid}/${f.name}`));
    }

    // Delete Supabase auth user (final step)
    await supabase.auth.admin.deleteUser(uid);

    // Mark as deleted
    await supabase
      .from("user_deletion_schedule")
      .update({ deleted_at: now.toISOString() })
      .eq("id", row.id);

    deleted++;
  }

  return NextResponse.json({ ok: true, warned, deleted });
}
