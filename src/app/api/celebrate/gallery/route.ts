import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: guests } = await supabase
      .from("celebration_guests")
      .select("id, celebration_event_id")
      .eq("invitation_token", token)
      .limit(1);
    const guest = guests?.[0];
    if (!guest) return NextResponse.json({ items: [] });

    const eventId = guest.celebration_event_id;

    const { data: mediaItems } = await supabase
      .from("celebration_memory_media")
      .select("*")
      .eq("media_type", "image")
      .eq("celebration_event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: memories } = await supabase
      .from("celebration_memories")
      .select("id, storyteller_name")
      .eq("celebration_event_id", eventId);

    const memoryMap: Record<string, string> = {};
    for (const m of memories ?? []) memoryMap[m.id] = m.storyteller_name ?? "Anonymous";

    const items = [];
    for (const item of mediaItems ?? []) {
      let url = item.file_url;
      if (!url?.startsWith("http")) {
        const { data: signed } = await supabase.storage
          .from("celebrate-media")
          .createSignedUrl(url, 3600);
        url = signed?.signedUrl ?? null;
      }
      if (!url) continue;
      items.push({
        id: item.id,
        url,
        caption: item.caption ?? "",
        storyteller_name: memoryMap[item.memory_id] ?? "Anonymous",
        created_at: item.created_at,
      });
    }

    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
