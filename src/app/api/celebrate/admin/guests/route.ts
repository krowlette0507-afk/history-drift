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

// POST { event_id } → list guests with RSVP status
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { event_id } = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data: guests, error } = await supabase
    .from("celebration_guests")
    .select(`
      id, first_name, last_name, email, mobile, invitation_token,
      invitation_sent, created_at,
      celebration_rsvps ( response, party_size, submitted_at )
    `)
    .eq("celebration_event_id", event_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ guests: guests ?? [] });
}
