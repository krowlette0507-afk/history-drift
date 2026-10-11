import { createServerClient } from "@/lib/supabase";

export interface ManagerRecord {
  id: string;
  email: string;
  name: string | null;
  manager_token: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
}

export async function validateManagerToken(token: string): Promise<ManagerRecord | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const { data: managers } = await supabase
    .from("celebration_managers")
    .select("id, email, name, manager_token, is_active, created_at, last_accessed_at")
    .eq("manager_token", token)
    .eq("is_active", true)
    .limit(1);

  const manager = managers?.[0] ?? null;
  if (!manager) return null;

  await supabase
    .from("celebration_managers")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", manager.id);

  return manager;
}
