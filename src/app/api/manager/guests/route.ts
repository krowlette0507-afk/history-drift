import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateManagerToken } from "@/lib/manager-auth";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://history-drift.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { token, action, ...body } = await req.json();
    const manager = await validateManagerToken(token);
    if (!manager) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    if (action === "list") {
      const { data: guests } = await supabase
        .from("celebration_guests")
        .select(`
          id, first_name, last_name, email, mobile, invitation_token,
          via_generic_rsvp, manager_id,
          celebration_rsvps(response, party_size, created_at),
          celebration_guest_party(id, first_name, last_name)
        `)
        .order("created_at", { ascending: true });
      return NextResponse.json({ guests: guests ?? [] });
    }

    if (action === "add_guest") {
      const { first_name, last_name, email, mobile } = body;
      if (!first_name?.trim()) return NextResponse.json({ error: "First name required" }, { status: 400 });
      const invitation_token = `inv-${first_name.trim().toLowerCase().replace(/\s+/g, "-")}-${randomBytes(4).toString("hex")}`;
      const { data: guest, error } = await supabase
        .from("celebration_guests")
        .insert({ first_name: first_name.trim(), last_name: last_name?.trim() || null, email: email?.trim() || null, mobile: mobile?.trim() || null, invitation_token, manager_id: manager.id })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ guest });
    }

    if (action === "send_reminder") {
      const { guest_id, method } = body;
      const { data: guest } = await supabase
        .from("celebration_guests")
        .select("first_name, last_name, email, mobile, invitation_token")
        .eq("id", guest_id)
        .single();
      if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

      const { data: events } = await supabase
        .from("celebration_events")
        .select("honoree_name, date, venue")
        .order("created_at", { ascending: false })
        .limit(1);
      const event = events?.[0];
      const inviteUrl = `${APP_URL}/celebrate/${guest.invitation_token}`;
      const eventDate = event?.date ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

      if (method === "email" && guest.email) {
        await resend.emails.send({
          from: "History Drift <noreply@historydrift.com>",
          to: guest.email,
          subject: `Reminder: RSVP for ${event?.honoree_name ?? "the celebration"}`,
          html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#f5ead8;margin:0;padding:40px 16px;">
            <div style="max-width:520px;margin:0 auto;background:#1a1208;border-radius:16px;overflow:hidden;">
              <div style="padding:32px 36px;">
                <p style="color:rgba(212,160,23,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px;">Friendly Reminder</p>
                <h2 style="color:#f5ead8;margin:0 0 16px;font-size:20px;">Hi ${guest.first_name},</h2>
                <p style="color:rgba(245,234,216,0.65);font-size:15px;line-height:1.7;margin:0 0 20px;">
                  We noticed you haven't responded yet to the invitation to celebrate <strong style="color:#f5ead8;">${event?.honoree_name ?? "the guest of honour"}</strong>${eventDate ? ` on ${eventDate}` : ""}. We'd love to know if you can make it!
                </p>
                <table cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#d4a017,#c8843a);border-radius:10px;padding:13px 28px;">
                  <a href="${inviteUrl}" style="color:#0f0a04;text-decoration:none;font-size:15px;font-weight:bold;">RSVP Now →</a>
                </td></tr></table>
              </div>
            </div>
          </body></html>`,
        });
        return NextResponse.json({ ok: true, method: "email" });
      }

      return NextResponse.json({ error: "No valid reminder method or contact info" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
