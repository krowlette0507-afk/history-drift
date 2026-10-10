import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { token, action, ...body } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    if (action === "list") {
      const { status_filter } = body;
      let query = supabase
        .from("celebration_memories")
        .select("*, celebration_memory_media(*)")
        .order("created_at", { ascending: false });
      if (status_filter && status_filter !== "all") {
        query = query.eq("status", status_filter);
      }
      const { data: memories } = await query;
      return NextResponse.json({ memories: memories ?? [] });
    }

    if (action === "update_status") {
      const { memory_id, status } = body;
      if (!memory_id || !status) return NextResponse.json({ error: "memory_id and status required" }, { status: 400 });
      const { error } = await supabase
        .from("celebration_memories")
        .update({ status })
        .eq("id", memory_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "carousel_update") {
      const { media_id, carousel_approved, carousel_order } = body;
      if (!media_id) return NextResponse.json({ error: "media_id required" }, { status: 400 });
      const { error } = await supabase
        .from("celebration_memory_media")
        .update({ carousel_approved, carousel_order })
        .eq("id", media_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "carousel_list") {
      const { data: media } = await supabase
        .from("celebration_memory_media")
        .select("*, celebration_memories(storyteller_name)")
        .eq("media_type", "image")
        .order("carousel_order", { ascending: true });
      return NextResponse.json({ media: media ?? [] });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
