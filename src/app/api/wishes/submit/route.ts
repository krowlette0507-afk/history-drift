import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { wishes_token, name, relationship, message, media } = await req.json();
    if (!wishes_token || !name?.trim()) {
      return NextResponse.json({ error: "wishes_token and name are required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: events } = await supabase
      .from("celebration_events")
      .select("id")
      .eq("wishes_token", wishes_token)
      .limit(1);

    const event = events?.[0];
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: memory, error } = await supabase
      .from("celebration_memories")
      .insert({
        celebration_event_id: event.id,
        guest_id: null,
        storyteller_name: name.trim(),
        storyteller_email: "",
        storyteller_mobile: "",
        relationship: relationship || "other",
        title: `Birthday wish from ${name.trim()}`,
        story_text: message ?? "",
        status: "submitted",
        permission_family: true,
        permission_historydrift: false,
      })
      .select()
      .single();

    if (error) throw error;

    if (media?.length) {
      await supabase.from("celebration_memory_media").insert(
        media.map((m: { media_type?: string; file_url: string; caption?: string; original_filename?: string }) => ({
          memory_id: memory.id,
          celebration_event_id: event.id,
          media_type: m.media_type ?? "image",
          file_url: m.file_url,
          caption: m.caption ?? "",
          original_filename: m.original_filename ?? "",
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
