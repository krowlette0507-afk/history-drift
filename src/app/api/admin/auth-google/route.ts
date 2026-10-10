import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();
    if (!access_token) return NextResponse.json({ error: "No access token" }, { status: 400 });

    // Verify the token with Supabase and get the user's email
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: userData, error: userError } = await anonClient.auth.getUser(access_token);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = userData.user.email.toLowerCase();

    // Look up the admin record by email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;
    const { data: admins } = await supabase
      .from("celebration_admins")
      .select("admin_token, name, is_super")
      .eq("email", email)
      .eq("is_active", true)
      .limit(1);

    const admin = admins?.[0];
    if (!admin) return NextResponse.json({ error: "Not authorised" }, { status: 403 });

    // Update last accessed
    await supabase
      .from("celebration_admins")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("email", email);

    return NextResponse.json({ admin_token: admin.admin_token });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
