import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: events } = await supabase
      .from("celebration_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    const event = events?.[0] ?? null;
    if (!event) return NextResponse.json({ error: "No celebration event found" }, { status: 404 });

    let guest = null;
    let rsvp = null;
    if (token) {
      const { data: guests } = await supabase
        .from("celebration_guests")
        .select("*")
        .eq("invitation_token", token)
        .limit(1);
      guest = guests?.[0] ?? null;

      if (guest) {
        const { data: rsvps } = await supabase
          .from("celebration_rsvps")
          .select("*")
          .eq("guest_id", guest.id)
          .limit(1);
        rsvp = rsvps?.[0] ?? null;
      }
    }

    return NextResponse.json({ event, guest, rsvp });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
