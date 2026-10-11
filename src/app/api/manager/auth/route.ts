import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateManagerToken } from "@/lib/manager-auth";
import { randomBytes } from "crypto";

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
    const event = events?.[0] ?? null;

    // Auto-create a personal guest record for this manager so they can share memories
    let invitation_token: string | null = null;
    const { data: existing } = await supabase
      .from("celebration_guests")
      .select("invitation_token")
      .eq("manager_id", manager.id)
      .eq("email", manager.email)
      .limit(1);
    if (existing?.[0]) {
      invitation_token = existing[0].invitation_token;
    } else if (event) {
      const nameParts = (manager.name ?? manager.email.split("@")[0]).toLowerCase().replace(/\s+/g, "-");
      const newToken = `mgr-${nameParts}-${randomBytes(4).toString("hex")}`;
      const firstName = manager.name?.split(" ")[0] ?? manager.email.split("@")[0];
      const lastName = manager.name?.split(" ").slice(1).join(" ") || null;
      const { data: guest } = await supabase
        .from("celebration_guests")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: manager.email,
          invitation_token: newToken,
          manager_id: manager.id,
          celebration_event_id: event.id,
        })
        .select("invitation_token")
        .single();
      invitation_token = guest?.invitation_token ?? null;
    }

    return NextResponse.json({ manager, event, invitation_token });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
