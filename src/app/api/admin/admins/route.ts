import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { validateAdminToken } from "@/lib/admin-auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, action, ...body } = await req.json();
    const admin = await validateAdminToken(token);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!admin.is_super) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any;

    if (action === "list") {
      const { data: admins } = await supabase
        .from("celebration_admins")
        .select("id, email, name, admin_token, is_active, is_super, created_at, last_accessed_at")
        .order("created_at", { ascending: true });
      return NextResponse.json({ admins: admins ?? [] });
    }

    if (action === "create") {
      const { email, name } = body;
      if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

      const admin_token = "admin-" + randomBytes(20).toString("hex");
      const { data: newAdmin, error } = await supabase
        .from("celebration_admins")
        .insert({
          email: email.trim().toLowerCase(),
          name: name?.trim() || null,
          admin_token,
          is_active: true,
          is_super: false,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ admin: newAdmin });
    }

    if (action === "toggle") {
      const { target_id } = body;
      if (!target_id) return NextResponse.json({ error: "target_id required" }, { status: 400 });
      const { data: target } = await supabase
        .from("celebration_admins")
        .select("is_active")
        .eq("id", target_id)
        .single();
      const { error } = await supabase
        .from("celebration_admins")
        .update({ is_active: !target?.is_active })
        .eq("id", target_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, is_active: !target?.is_active });
    }

    if (action === "delete") {
      const { target_id } = body;
      if (!target_id) return NextResponse.json({ error: "target_id required" }, { status: 400 });
      await supabase.from("celebration_admins").delete().eq("id", target_id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
