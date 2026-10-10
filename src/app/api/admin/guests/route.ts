import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, action, ...body } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    if (action === "list") {
      const { data: guests } = await supabase
        .from("celebration_guests")
        .select("*, celebration_rsvps(response, party_size, dietary_restrictions, notes, created_at)")
        .order("created_at", { ascending: true });
      return NextResponse.json({ guests: guests ?? [] });
    }

    if (action === "create") {
      const { first_name, last_name, email, mobile } = body;
      if (!first_name?.trim()) return NextResponse.json({ error: "First name required" }, { status: 400 });

      const { data: events } = await supabase
        .from("celebration_events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);
      const event = events?.[0];
      if (!event) return NextResponse.json({ error: "No event found" }, { status: 404 });

      const slug = first_name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const suffix = randomBytes(4).toString("hex");
      const invitation_token = `inv-${slug}-${suffix}`;

      const { data: guest, error } = await supabase
        .from("celebration_guests")
        .insert({
          celebration_event_id: event.id,
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
          email: email?.trim() || null,
          mobile: mobile?.trim() || null,
          invitation_token,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ guest });
    }

    if (action === "delete") {
      const { guest_id } = body;
      if (!guest_id) return NextResponse.json({ error: "guest_id required" }, { status: 400 });
      await supabase.from("celebration_rsvps").delete().eq("guest_id", guest_id);
      await supabase.from("celebration_party_members").delete().eq("rsvp_id",
        supabase.from("celebration_rsvps").select("id").eq("guest_id", guest_id));
      await supabase.from("celebration_guests").delete().eq("id", guest_id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
