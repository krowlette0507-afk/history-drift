import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data, error } = await supabase
    .from("family_invites")
    .select("id, invitee_name, message, status, user_id")
    .eq("token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });

  // Fetch inviter's display name
  const { data: profile } = await supabase.auth.admin.getUserById(data.user_id);
  const inviterName = profile?.user?.user_metadata?.full_name ?? profile?.user?.email ?? "Someone";

  return NextResponse.json({
    id: data.id,
    inviteeName: data.invitee_name,
    message: data.message,
    status: data.status,
    inviterName,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { contributorName, contributorEmail, relationship, story } = await req.json();
  if (!contributorName || !story) {
    return NextResponse.json({ error: "contributorName and story are required" }, { status: 400 });
  }

  // Look up invite by token
  const { data: invite, error: inviteErr } = await supabase
    .from("family_invites")
    .select("id")
    .eq("token", token)
    .single();

  if (inviteErr || !invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });

  // Save contribution
  const { error: contribErr } = await supabase
    .from("family_contributions")
    .insert({
      invite_id: invite.id,
      contributor_name: contributorName,
      contributor_email: contributorEmail ?? null,
      relationship: relationship ?? null,
      story,
    });

  if (contribErr) return NextResponse.json({ error: contribErr.message }, { status: 500 });

  // Mark invite as contributed
  await supabase
    .from("family_invites")
    .update({ status: "contributed" })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true });
}
