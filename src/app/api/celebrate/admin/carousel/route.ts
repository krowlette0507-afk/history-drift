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

  if (body.action === "get") {
    const { event_id } = body;
    const { data: media, error } = await supabase
      .from("celebration_memory_media")
      .select(`
        id, file_url, media_type, caption, carousel_approved, carousel_order, original_filename, created_at,
        celebration_memories!memory_id(storyteller_name, title)
      `)
      .eq("celebration_event_id", event_id)
      .eq("media_type", "image")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ media: media ?? [] });
  }

  if (body.action === "save") {
    const { items } = body as { items: { id: string; carousel_approved: boolean; carousel_order: number }[] };
    const errors: string[] = [];
    for (const item of items) {
      const { error } = await supabase
        .from("celebration_memory_media")
        .update({ carousel_approved: item.carousel_approved, carousel_order: item.carousel_order })
        .eq("id", item.id);
      if (error) errors.push(error.message);
    }
    if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
