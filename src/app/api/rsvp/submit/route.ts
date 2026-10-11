import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { manager_token, first_name, last_name, email, mobile, response, party_members } = await req.json();

    if (!manager_token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
    if (!first_name?.trim()) return NextResponse.json({ error: "First name required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: managers } = await supabase
      .from("celebration_managers")
      .select("id, is_active")
      .eq("manager_token", manager_token)
      .eq("is_active", true)
      .limit(1);
    const manager = managers?.[0];
    if (!manager) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

    const { data: events } = await supabase
      .from("celebration_events")
      .select("id, honoree_name, wishes_token")
      .order("created_at", { ascending: false })
      .limit(1);
    const event = events?.[0];
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

    const invitation_token = `rsvp-${first_name.trim().toLowerCase().replace(/\s+/g, "-")}-${randomBytes(4).toString("hex")}`;

    const { data: guest, error } = await supabase
      .from("celebration_guests")
      .insert({
        first_name: first_name.trim(),
        last_name: last_name?.trim() || null,
        email: email?.trim() || null,
        mobile: mobile?.trim() || null,
        invitation_token,
        manager_id: manager.id,
        via_generic_rsvp: true,
        celebration_event_id: event.id,
        rsvp_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rsvpResponse = response === "no" ? "no" : response === "maybe" ? "maybe" : "yes";
    const { data: rsvp } = await supabase
      .from("celebration_rsvps")
      .insert({
        guest_id: guest.id,
        celebration_event_id: event.id,
        response: rsvpResponse,
        party_size: 1 + (Array.isArray(party_members) ? party_members.length : 0),
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (rsvp && Array.isArray(party_members) && party_members.length) {
      await supabase.from("celebration_guest_party").insert(
        party_members
          .filter((m: { first_name?: string }) => m.first_name?.trim())
          .map((m: { first_name: string; last_name?: string }) => ({
            guest_id: guest.id,
            first_name: m.first_name.trim(),
            last_name: m.last_name?.trim() || null,
          }))
      );
    }

    return NextResponse.json({
      ok: true,
      invitation_token: guest.invitation_token,
      wishes_token: event.wishes_token,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
