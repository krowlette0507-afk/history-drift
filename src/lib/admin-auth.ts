import { createServerClient } from "@/lib/supabase";

export interface AdminRecord {
  id: string;
  email: string;
  name: string | null;
  admin_token: string;
  is_active: boolean;
  is_super: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

export async function validateAdminToken(token: string): Promise<AdminRecord | null> {
  if (!token?.trim()) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const { data } = await supabase
    .from("celebration_admins")
    .select("*")
    .eq("admin_token", token.trim())
    .eq("is_active", true)
    .limit(1);

  const admin: AdminRecord | null = data?.[0] ?? null;
  if (admin) {
    await supabase
      .from("celebration_admins")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", admin.id);
  }
  return admin;
}
