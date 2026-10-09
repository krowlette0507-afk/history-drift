import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { wishes_token } = await req.json();
    if (!wishes_token) return NextResponse.json({ error: "wishes_token required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { data: events } = await supabase
      .from("celebration_events")
      .select("id, honoree_name, title, hero_images, is_active")
      .eq("wishes_token", wishes_token)
      .limit(1);

    const event = events?.[0] ?? null;
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ event });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
