import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_ID = "0ee40321-7a90-4c7d-ba9d-cfa1b97d4f11";

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await anonClient.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data: event, error } = await supabase
    .from("celebration_events")
    .insert({
      honoree_name: body.honoree_name,
      title: body.title,
      description: body.description ?? "",
      welcome_message: body.welcome_message ?? "",
      date: body.date,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      venue: body.venue,
      address: body.address ?? "",
      parking_information: body.parking_information ?? "",
      dress_information: body.dress_information ?? "",
      rsvp_deadline: body.rsvp_deadline || null,
      host_contact: body.host_contact ?? "",
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event });
}
