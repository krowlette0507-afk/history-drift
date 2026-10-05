import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { event_id } = await req.json();
    if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { data: media, error } = await supabase
      .from("celebration_memory_media")
      .select("id, file_url, media_type, caption, carousel_order")
      .eq("celebration_event_id", event_id)
      .eq("carousel_approved", true)
      .order("carousel_order", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ media: media ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
