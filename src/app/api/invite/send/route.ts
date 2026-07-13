import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.historydrift.com";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  // Verify caller is authenticated
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteeEmail, inviteeName, message } = await req.json();
  if (!inviteeEmail) return NextResponse.json({ error: "inviteeEmail required" }, { status: 400 });

  // Create invite row
  const { data: invite, error } = await supabase
    .from("family_invites")
    .insert({
      user_id: user.id,
      invitee_email: inviteeEmail,
      invitee_name: inviteeName ?? null,
      message: message ?? null,
    })
    .select("token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const link = `${APP_URL}/contribute/${invite.token}`;
  const senderName = user.user_metadata?.full_name ?? user.email ?? "Someone";

  // Send email via Resend
  await resend.emails.send({
    from: "History Drift <noreply@historydrift.com>",
    to: inviteeEmail,
    subject: `${senderName} is building their life story — share a memory`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1208;background:#fdf8f2;padding:40px 32px;border-radius:12px;">
        <div style="font-size:13px;color:#8a6830;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">History Drift</div>
        <h1 style="font-size:26px;font-weight:bold;color:#2a1a06;margin:0 0 16px;">You've been invited to contribute</h1>
        <p style="font-size:16px;line-height:1.7;color:#3a2a10;margin:0 0 20px;">
          <strong>${senderName}</strong> is capturing their life story on History Drift and would love to hear a memory from you.
        </p>
        ${message ? `<blockquote style="border-left:3px solid #c8843a;padding:12px 16px;margin:0 0 24px;background:#fff8ee;color:#5a3a10;font-style:italic;">${message}</blockquote>` : ""}
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#7a2d8a,#c84a9a);color:white;text-decoration:none;padding:14px 28px;border-radius:10px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;margin-bottom:28px;">
          Share Your Memory →
        </a>
        <p style="font-size:12px;color:#9a7a50;line-height:1.6;border-top:1px solid #e8d8b8;padding-top:20px;margin:0;">
          This link is personal to you — no account needed. Your memory will be shared with ${senderName} and kept private to their History Drift story.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
