import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { manager_token } = await req.json();
    if (!manager_token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: managers } = await supabase
      .from("celebration_managers")
      .select("id, name, is_active")
      .eq("manager_token", manager_token)
      .eq("is_active", true)
      .limit(1);
    const manager = managers?.[0];
    if (!manager) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

    const { data: events } = await supabase
      .from("celebration_events")
      .select("id, title, honoree_name, date, start_time, end_time, venue, address, dress_information, parking_information, rsvp_deadline, hero_images, wishes_token, description, welcome_message")
      .order("created_at", { ascending: false })
      .limit(1);
    const event = events?.[0] ?? null;
    if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

    return NextResponse.json({ event, manager_id: manager.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
