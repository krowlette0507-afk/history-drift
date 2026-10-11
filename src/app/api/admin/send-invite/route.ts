import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://history-drift.vercel.app";

interface GuestRow {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  invitation_token: string;
  celebration_rsvps?: { id: string }[];
}

interface EventRow {
  honoree_name: string;
  date: string | null;
  venue: string | null;
  address: string | null;
}

function inviteEmailHtml(guest: GuestRow, event: EventRow, inviteUrl: string, eventDate: string | null) {
  const honoree = event.honoree_name;
  const firstName = guest.first_name;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5ead8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5ead8;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1208;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(160deg,#0a0704,#1a1208);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(212,160,23,0.2);">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,160,23,0.6);">History Drift · Celebration</p>
          <h1 style="margin:0;font-size:28px;font-weight:bold;color:#f5ead8;line-height:1.3;">You're invited</h1>
          <p style="margin:12px 0 0;font-size:16px;color:rgba(245,234,216,0.6);">to celebrate</p>
          <p style="margin:8px 0 0;font-size:24px;font-weight:bold;color:#d4a017;">${honoree}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:rgba(245,234,216,0.8);line-height:1.7;">
            Dear ${firstName},
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:rgba(245,234,216,0.65);line-height:1.8;">
            You are warmly invited to join us in celebrating a truly special milestone — the life and legacy of <strong style="color:#f5ead8;">${honoree}</strong>.
          </p>

          ${eventDate || event.venue ? `
          <!-- Event Details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(212,160,23,0.07);border:1px solid rgba(212,160,23,0.2);border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,160,23,0.5);">Event Details</p>
              ${eventDate ? `<p style="margin:0 0 8px;font-size:14px;color:#f5ead8;"><span style="color:rgba(212,160,23,0.6);width:60px;display:inline-block;">Date</span>${eventDate}</p>` : ""}
              ${event.venue ? `<p style="margin:0 0 8px;font-size:14px;color:#f5ead8;"><span style="color:rgba(212,160,23,0.6);width:60px;display:inline-block;">Venue</span>${event.venue}</p>` : ""}
              ${event.address ? `<p style="margin:0;font-size:14px;color:rgba(245,234,216,0.6);padding-left:60px;">${event.address}</p>` : ""}
            </td></tr>
          </table>
          ` : ""}

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
            <tr><td style="background:linear-gradient(135deg,#d4a017,#c8843a);border-radius:12px;padding:16px 36px;text-align:center;">
              <a href="${inviteUrl}" style="color:#0f0a04;text-decoration:none;font-size:16px;font-weight:bold;font-family:Georgia,serif;letter-spacing:0.5px;">RSVP &amp; View Celebration →</a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;color:rgba(245,234,216,0.35);text-align:center;">Or copy this link:</p>
          <p style="margin:0 0 28px;font-size:12px;color:rgba(212,160,23,0.5);text-align:center;word-break:break-all;">${inviteUrl}</p>

          <p style="margin:0;font-size:14px;color:rgba(245,234,216,0.5);line-height:1.7;">
            On this page you can RSVP, share a memory or story, and contribute a photo or video message for ${honoree}.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 32px;border-top:1px solid rgba(212,160,23,0.1);text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(245,234,216,0.2);line-height:1.6;">
            This invitation was sent personally to you. · Powered by History Drift
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { token, action, guest_id } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: events } = await supabase
      .from("celebration_events")
      .select("honoree_name, date, venue, address")
      .order("created_at", { ascending: false })
      .limit(1);
    const event: EventRow | null = events?.[0] ?? null;
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

    let guests: GuestRow[] = [];

    if (action === "single" && guest_id) {
      const { data } = await supabase
        .from("celebration_guests")
        .select("id, first_name, last_name, email, mobile, invitation_token")
        .eq("id", guest_id)
        .single();
      if (data?.email) guests = [data];
    } else if (action === "all_pending") {
      const { data } = await supabase
        .from("celebration_guests")
        .select("id, first_name, last_name, email, mobile, invitation_token, celebration_rsvps(id)")
        .order("created_at", { ascending: true });
      guests = ((data ?? []) as GuestRow[]).filter((g) => g.email && !g.celebration_rsvps?.length);
    }

    let sent = 0, skipped = 0;
    const errors: string[] = [];

    for (const guest of guests) {
      if (!guest.email) { skipped++; continue; }
      const inviteUrl = `${APP_URL}/celebrate/${guest.invitation_token}`;
      const eventDate = event.date
        ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : null;
      try {
        const result = await resend.emails.send({
          from: "History Drift <noreply@historydrift.com>",
          to: guest.email,
          subject: `You're invited to celebrate ${event.honoree_name}`,
          html: inviteEmailHtml(guest, event, inviteUrl, eventDate),
        });
        if (result.error) {
          errors.push(`${guest.email}: ${JSON.stringify(result.error)}`);
          skipped++;
        } else {
          sent++;
        }
      } catch (err) {
        errors.push(`${guest.email}: ${String(err)}`);
        skipped++;
      }
    }

    return NextResponse.json({ sent, skipped, errors });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
