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

function makeToken(firstName: string, lastName: string): string {
  const slug = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 30);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${slug}-${rand}`;
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { event_id, first_name, last_name, email, mobile } = body;

  if (!event_id || !first_name) {
    return NextResponse.json({ error: "event_id and first_name are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const token = makeToken(first_name, last_name ?? "");

  const { data: guest, error } = await supabase
    .from("celebration_guests")
    .insert({
      celebration_event_id: event_id,
      first_name: first_name.trim(),
      last_name: last_name?.trim() ?? null,
      email: email?.trim() ?? null,
      mobile: mobile?.trim() ?? null,
      invitation_token: token,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, guest });
}
