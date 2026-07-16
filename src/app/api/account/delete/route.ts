import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = user.id;

  // Schedule deletion in 30 days (gives them time to change their mind)
  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("user_deletion_schedule").upsert({
    user_id: uid,
    scheduled_for: scheduledFor,
    reason: "user_requested",
  }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true, scheduledFor });
}
