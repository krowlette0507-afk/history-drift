import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Invalid or inactive admin token" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { data: events } = await supabase
      .from("celebration_events")
      .select("id, title, honoree_name, date, venue, address, is_active, wishes_token")
      .order("created_at", { ascending: false })
      .limit(1);

    return NextResponse.json({ admin, event: events?.[0] ?? null });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
