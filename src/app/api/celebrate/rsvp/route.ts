import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const {
      token, response, party_size, party_members,
      dietary_restrictions, notes, email, mobile,
    } = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: guests } = await supabase
      .from("celebration_guests")
      .select("*")
      .eq("invitation_token", token)
      .limit(1);
    const guest = guests?.[0];
    if (!guest) return NextResponse.json({ error: "Invalid invitation token" }, { status: 403 });

    const cappedPartySize = Math.min(Math.max(1, party_size ?? 1), 5);

    const now = new Date().toISOString();
    const rsvpData = {
      guest_id: guest.id,
      celebration_event_id: guest.celebration_event_id,
      response: response ?? "yes",
      party_size: cappedPartySize,
      dietary_restrictions: dietary_restrictions ?? "",
      notes: notes ?? "",
      updated_at: now,
    };

    const { data: existingRsvps } = await supabase
      .from("celebration_rsvps")
      .select("id, submitted_at")
      .eq("guest_id", guest.id)
      .limit(1);
    const existing = existingRsvps?.[0];

    let rsvp;
    if (existing) {
      const { data } = await supabase
        .from("celebration_rsvps")
        .update({ ...rsvpData, submitted_at: existing.submitted_at ?? now })
        .eq("id", existing.id)
        .select()
        .single();
      rsvp = data;
      await supabase.from("celebration_guest_party_members").delete().eq("rsvp_id", existing.id);
    } else {
      const { data } = await supabase
        .from("celebration_rsvps")
        .insert({ ...rsvpData, submitted_at: now })
        .select()
        .single();
      rsvp = data;
    }

    const cappedMembers = (party_members ?? []).slice(0, cappedPartySize - 1);
    if (rsvp && cappedMembers.length) {
      await supabase.from("celebration_guest_party_members").insert(
        cappedMembers.map((m: { name: string; is_child: boolean }) => ({
          rsvp_id: rsvp.id,
          guest_id: guest.id,
          name: m.name,
          adult_or_child: m.is_child ? "child" : "adult",
        }))
      );
    }

    await supabase
      .from("celebration_guests")
      .update({ email: email ?? guest.email, mobile: mobile ?? guest.mobile, rsvp_date: now })
      .eq("id", guest.id);

    return NextResponse.json({ ok: true, rsvp });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
