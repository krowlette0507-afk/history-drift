import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { error } = await supabase.storage
      .from("celebrate-media")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data: signed } = await supabase.storage
      .from("celebrate-media")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    return NextResponse.json({ url: path, signed_url: signed?.signedUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
