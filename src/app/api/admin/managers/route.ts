import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://history-drift.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { token, action, ...body } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!admin.is_super) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    if (action === "list") {
      const { data: managers } = await supabase
        .from("celebration_managers")
        .select("id, email, name, manager_token, is_active, created_at, last_accessed_at")
        .order("created_at", { ascending: true });
      return NextResponse.json({ managers: managers ?? [] });
    }

    if (action === "create") {
      const { email, name } = body;
      if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });
      const manager_token = "mgr-" + randomBytes(20).toString("hex");
      const { data: manager, error } = await supabase
        .from("celebration_managers")
        .insert({ email: email.trim().toLowerCase(), name: name?.trim() || null, manager_token, is_active: true })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ manager });
    }

    if (action === "toggle") {
      const { target_id } = body;
      if (!target_id) return NextResponse.json({ error: "target_id required" }, { status: 400 });
      const { data: target } = await supabase
        .from("celebration_managers")
        .select("is_active")
        .eq("id", target_id)
        .single();
      await supabase.from("celebration_managers").update({ is_active: !target?.is_active }).eq("id", target_id);
      return NextResponse.json({ ok: true, is_active: !target?.is_active });
    }

    if (action === "send_invite") {
      const { target_id } = body;
      if (!target_id) return NextResponse.json({ error: "target_id required" }, { status: 400 });
      const { data: target } = await supabase
        .from("celebration_managers")
        .select("email, name, manager_token")
        .eq("id", target_id)
        .single();
      if (!target?.email) return NextResponse.json({ error: "Manager email not found" }, { status: 404 });

      const { data: events } = await supabase
        .from("celebration_events")
        .select("honoree_name, title")
        .order("created_at", { ascending: false })
        .limit(1);
      const eventTitle = events?.[0]?.title ?? `${events?.[0]?.honoree_name ?? "the"} Celebration`;
      const managerUrl = `${APP_URL}/manager/${target.manager_token}`;
      const firstName = target.name?.split(" ")[0] ?? "there";

      const result = await resend.emails.send({
        from: "History Drift <noreply@historydrift.com>",
        to: target.email,
        subject: `You've been added as a manager — ${eventTitle}`,
        html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5ead8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ead8;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#1a1208;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(212,160,23,0.2);">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,160,23,0.5);">History Drift · Manager Access</p>
          <h1 style="margin:0;font-size:22px;font-weight:bold;color:#f5ead8;">You've been added as a manager</h1>
        </td></tr>
        <tr><td style="padding:28px 40px;">
          <p style="margin:0 0 18px;font-size:15px;color:rgba(245,234,216,0.75);line-height:1.7;">Hi ${firstName},</p>
          <p style="margin:0 0 12px;font-size:15px;color:rgba(245,234,216,0.65);line-height:1.8;">
            You've been invited to help coordinate the <strong style="color:#f5ead8;">${eventTitle}</strong> celebration.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:rgba(245,234,216,0.55);line-height:1.8;">
            Your manager link gives you access to a personal RSVP link that you can share with your guests, plus tools to track responses and send reminders.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:linear-gradient(135deg,#d4a017,#c8843a);border-radius:10px;padding:14px 28px;">
              <a href="${managerUrl}" style="color:#0f0a04;text-decoration:none;font-size:15px;font-weight:bold;font-family:Georgia,serif;">Open Manager Dashboard →</a>
            </td></tr>
          </table>
          <p style="margin:0 0 6px;font-size:12px;color:rgba(245,234,216,0.3);">Or copy this link:</p>
          <p style="margin:0;font-size:11px;color:rgba(212,160,23,0.45);word-break:break-all;">${managerUrl}</p>
        </td></tr>
        <tr><td style="padding:16px 40px 28px;border-top:1px solid rgba(212,160,23,0.1);">
          <p style="margin:0;font-size:11px;color:rgba(245,234,216,0.2);">Keep this link private — it is your personal manager access.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      });

      if (result.error) return NextResponse.json({ error: JSON.stringify(result.error) }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
