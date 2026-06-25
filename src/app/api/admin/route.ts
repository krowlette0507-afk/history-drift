import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const ADMIN_USER_ID = "0ee40321-7a90-4c7d-ba9d-cfa1b97d4f11";

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const { data } = await supabase.auth.getUser(token);
  if (data.user?.id !== ADMIN_USER_ID) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "overview";

  if (tab === "overview") {
    const [usersRes, sessionsRes, exchangesRes, supportRes] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from("interview_sessions").select("id, created_at"),
      supabase.from("interview_exchanges").select("id, created_at"),
      supabase.from("support_messages").select("id, status, created_at"),
    ]);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const users = usersRes.data?.users || [];
    const sessions = sessionsRes.data || [];
    const exchanges = exchangesRes.data || [];
    const support = supportRes.data || [];
    return NextResponse.json({
      totalUsers: users.length,
      newUsersThisWeek: users.filter((u: { created_at: string }) => new Date(u.created_at) > weekAgo).length,
      totalSessions: sessions.length,
      newSessionsThisWeek: sessions.filter((s: { created_at: string }) => new Date(s.created_at) > weekAgo).length,
      totalAnswers: exchanges.length,
      newAnswersThisWeek: exchanges.filter((e: { created_at: string }) => new Date(e.created_at) > weekAgo).length,
      openSupportTickets: support.filter((s: { status: string }) => s.status === "open").length,
    });
  }

  if (tab === "users") {
    const { data } = await supabase.auth.admin.listUsers();
    const users = data?.users || [];
    const { data: sessions } = await supabase.from("interview_sessions").select("user_id, id, exchange_count, completed_at");
    const sessionMap = new Map<string, { exchange_count: number; completed_at: string | null }[]>();
    for (const s of (sessions || []) as { user_id: string; exchange_count: number; completed_at: string | null }[]) {
      const arr = sessionMap.get(s.user_id) || [];
      arr.push(s);
      sessionMap.set(s.user_id, arr);
    }
    return NextResponse.json(users.map((u: { id: string; email: string; user_metadata: { full_name?: string }; created_at: string; last_sign_in_at: string }) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || "",
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      sessionCount: sessionMap.get(u.id)?.length || 0,
      answerCount: sessionMap.get(u.id)?.reduce((sum, s) => sum + (s.exchange_count || 0), 0) || 0,
      completedSessions: sessionMap.get(u.id)?.filter(s => s.completed_at).length || 0,
    })));
  }

  if (tab === "sessions") {
    const { data: sessions } = await supabase.from("interview_sessions")
      .select("*").order("started_at", { ascending: false }).limit(100);
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const userMap = new Map((usersData?.users || []).map((u: { id: string; email: string }) => [u.id, u.email]));
    return NextResponse.json(((sessions || []) as Record<string, unknown>[]).map(s => ({ ...s, userEmail: userMap.get(s.user_id as string) || s.user_id })));
  }

  if (tab === "support") {
    const { data } = await supabase.from("support_messages")
      .select("*").order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: "Unknown tab" }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  const { id, status } = await req.json();
  await supabase.from("support_messages").update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}
