import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateManagerToken } from "@/lib/manager-auth";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const manager = await validateManagerToken(token);
    if (!manager) return NextResponse.json({ error: "Invalid or inactive manager token" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { data: events } = await supabase
      .from("celebration_events")
      .select("id, title, honoree_name, date, start_time, end_time, venue, address, dress_information, parking_information, rsvp_deadline, hero_images, wishes_token")
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({ manager, event: events?.[0] ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
