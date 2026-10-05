import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const {
      token, storyteller_name, storyteller_email, storyteller_mobile,
      relationship, title, story_text, audio_file, transcript,
      approximate_year, decade, location, people_present,
      permission_family, permission_historydrift, media,
    } = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    const { data: guests } = await supabase
      .from("celebration_guests")
      .select("*")
      .eq("invitation_token", token)
      .limit(1);
    const guest = guests?.[0];
    if (!guest) return NextResponse.json({ error: "Invalid invitation token" }, { status: 403 });

    const { data: memory, error: memErr } = await supabase
      .from("celebration_memories")
      .insert({
        celebration_event_id: guest.celebration_event_id,
        guest_id: guest.id,
        storyteller_name: storyteller_name ?? guest.first_name,
        storyteller_email: storyteller_email ?? guest.email ?? "",
        storyteller_mobile: storyteller_mobile ?? guest.mobile ?? "",
        relationship: relationship ?? "other",
        title: title ?? "A shared memory",
        story_text: story_text ?? "",
        audio_file: audio_file ?? "",
        transcript: transcript ?? "",
        approximate_year: approximate_year ?? null,
        decade: decade ?? "",
        location: location ?? "",
        people_present: people_present ?? [],
        permission_family: permission_family !== false,
        permission_historydrift: permission_historydrift === true,
        status: "submitted",
      })
      .select()
      .single();

    if (memErr) throw memErr;

    if (media?.length) {
      await supabase.from("celebration_memory_media").insert(
        media.map((m: { media_type?: string; file_url: string; caption?: string; original_filename?: string }) => ({
          memory_id: memory.id,
          celebration_event_id: guest.celebration_event_id,
          media_type: m.media_type ?? "image",
          file_url: m.file_url,
          caption: m.caption ?? "",
          original_filename: m.original_filename ?? "",
        }))
      );
    }

    return NextResponse.json({ ok: true, memory });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
