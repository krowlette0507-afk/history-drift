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

  const { event_id } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data: rsvps } = await supabase
    .from("celebration_rsvps")
    .select("response, party_size")
    .eq("celebration_event_id", event_id);

  const rsvp_summary = { yes: 0, no: 0, maybe: 0, total_guests: 0 };
  for (const r of rsvps ?? []) {
    if (r.response === "yes") { rsvp_summary.yes++; rsvp_summary.total_guests += r.party_size ?? 1; }
    else if (r.response === "no") rsvp_summary.no++;
    else rsvp_summary.maybe++;
  }

  const { data: memoriesRaw } = await supabase
    .from("celebration_memories")
    .select("id, storyteller_name, title, status, created_at")
    .eq("celebration_event_id", event_id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: mediaCheck } = await supabase
    .from("celebration_memory_media")
    .select("memory_id")
    .eq("celebration_event_id", event_id)
    .eq("media_type", "image");

  const photoMemoryIds = new Set((mediaCheck ?? []).map((m: { memory_id: string }) => m.memory_id));

  const recent_memories = (memoriesRaw ?? []).map((m: {
    id: string; storyteller_name: string; title: string; status: string; created_at: string
  }) => ({
    ...m,
    has_photo: photoMemoryIds.has(m.id),
  }));

  return NextResponse.json({ rsvp_summary, recent_memories });
}
