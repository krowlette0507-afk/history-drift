"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_USER_ID = "0ee40321-7a90-4c7d-ba9d-cfa1b97d4f11";

type Tab = "overview" | "users" | "sessions" | "support" | "payments";

interface Overview {
  totalUsers: number; newUsersThisWeek: number;
  totalSessions: number; newSessionsThisWeek: number;
  totalAnswers: number; newAnswersThisWeek: number;
  openSupportTickets: number;
}
interface UserRow { id: string; email: string; name: string; createdAt: string; lastSignIn: string; sessionCount: number; answerCount: number; completedSessions: number; }
interface SessionRow { id: string; user_id: string; userEmail: string; interviewer_name: string; started_at: string; completed_at: string | null; exchange_count: number; title: string | null; }
interface SupportRow { id: string; user_email: string; subject: string; message: string; status: string; created_at: string; }

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_USER_ID) {
        router.replace("/");
        return;
      }
      setToken(session.access_token);
    });
  }, [router]);

  const fetchTab = useCallback(async (t: Tab, tok: string) => {
    if (t === "payments") { setData(null); setLoading(false); return; }
    setLoading(true);
    const res = await fetch(`/api/admin?tab=${t}`, { headers: { Authorization: `Bearer ${tok}` } });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) fetchTab(tab, token);
  }, [tab, token, fetchTab]);

  const updateSupport = async (id: string, status: string) => {
    if (!token) return;
    await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, status }) });
    fetchTab("support", token);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "sessions", label: "Interviews" },
    { id: "support", label: "Support" },
    { id: "payments", label: "Payments" },
  ];

  const showLoader: boolean = loading && tab !== "payments";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-amber-200 font-serif font-bold text-3xl">Admin Dashboard</h1>
            <p className="text-amber-700/60 text-sm font-sans mt-1">History Drift — Internal Management</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-amber-600 text-sm font-sans hover:text-amber-400">← Back to App</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(101,67,20,0.2)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-lg text-sm font-serif font-semibold transition-all"
              style={tab === t.id
                ? { background: "linear-gradient(135deg, #8a5021, #c8843a)", color: "#fef3e2" }
                : { color: "#92600a", background: "transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        {showLoader ? <div className="text-amber-700/50 text-center py-20 font-serif">Loading...</div> : null}

        {/* Overview */}
        {!loading && tab === "overview" && data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: (data as Overview).totalUsers, sub: `+${(data as Overview).newUsersThisWeek} this week` },
              { label: "Total Interviews", value: (data as Overview).totalSessions, sub: `+${(data as Overview).newSessionsThisWeek} this week` },
              { label: "Total Answers", value: (data as Overview).totalAnswers, sub: `+${(data as Overview).newAnswersThisWeek} this week` },
              { label: "Open Support", value: (data as Overview).openSupportTickets, sub: "tickets" },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-6" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
                <p className="text-amber-700/60 text-xs uppercase tracking-wider font-sans mb-2">{card.label}</p>
                <p className="text-amber-200 font-serif font-bold text-4xl">{card.value}</p>
                <p className="text-amber-700/50 text-xs font-sans mt-1">{card.sub}</p>
              </div>
            ))}
            <div className="col-span-2 md:col-span-4 rounded-2xl p-6" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
              <p className="text-amber-700/60 text-xs uppercase tracking-wider font-sans mb-3">Quick Actions</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setTab("support")} className="px-4 py-2 rounded-lg text-sm font-serif text-amber-200" style={{ background: "rgba(101,67,20,0.3)" }}>View Support Tickets</button>
                <button onClick={() => setTab("users")} className="px-4 py-2 rounded-lg text-sm font-serif text-amber-200" style={{ background: "rgba(101,67,20,0.3)" }}>Manage Users</button>
                <button onClick={() => setTab("payments")} className="px-4 py-2 rounded-lg text-sm font-serif text-amber-200" style={{ background: "rgba(101,67,20,0.3)" }}>Payment Setup</button>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {!loading && tab === "users" && Array.isArray(data) && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
            <table className="w-full text-sm font-sans">
              <thead style={{ background: "rgba(20,12,4,0.8)" }}>
                <tr>{["Name", "Email", "Joined", "Last Active", "Sessions", "Answers"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-amber-700/60 text-xs uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(data as UserRow[]).map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? "rgba(30,18,6,0.6)" : "rgba(20,12,4,0.6)", borderTop: "1px solid rgba(101,67,20,0.15)" }}>
                    <td className="px-4 py-3 text-amber-200 font-serif">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-amber-400">{u.email}</td>
                    <td className="px-4 py-3 text-amber-700/70">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-amber-700/70">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-amber-200">{u.sessionCount}</td>
                    <td className="px-4 py-3 text-amber-200">{u.answerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sessions */}
        {!loading && tab === "sessions" && Array.isArray(data) && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
            <table className="w-full text-sm font-sans">
              <thead style={{ background: "rgba(20,12,4,0.8)" }}>
                <tr>{["User", "Interviewer", "Started", "Status", "Answers"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-amber-700/60 text-xs uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(data as SessionRow[]).map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "rgba(30,18,6,0.6)" : "rgba(20,12,4,0.6)", borderTop: "1px solid rgba(101,67,20,0.15)" }}>
                    <td className="px-4 py-3 text-amber-400">{s.userEmail}</td>
                    <td className="px-4 py-3 text-amber-200 font-serif">{s.interviewer_name}</td>
                    <td className="px-4 py-3 text-amber-700/70">{new Date(s.started_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: s.completed_at ? "rgba(20,80,20,0.4)" : "rgba(80,50,10,0.4)", color: s.completed_at ? "#6ee7b7" : "#d4a017" }}>
                        {s.completed_at ? "Complete" : "In Progress"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-200">{s.exchange_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Support */}
        {!loading && tab === "support" && Array.isArray(data) && (
          <div className="space-y-4">
            {(data as SupportRow[]).length === 0 && <p className="text-amber-700/50 text-center py-20 font-serif">No support tickets yet.</p>}
            {(data as SupportRow[]).map(ticket => (
              <div key={ticket.id} className="rounded-2xl p-5" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-amber-200 font-serif font-semibold">{ticket.subject}</span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: ticket.status === "open" ? "rgba(180,80,20,0.3)" : "rgba(20,80,20,0.3)", color: ticket.status === "open" ? "#f59e0b" : "#6ee7b7" }}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-amber-700/60 text-xs font-sans mb-2">{ticket.user_email} · {new Date(ticket.created_at).toLocaleString()}</p>
                    <p className="text-amber-300/80 text-sm font-sans">{ticket.message}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {ticket.status === "open" && (
                      <button onClick={() => updateSupport(ticket.id, "resolved")}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans text-emerald-300"
                        style={{ background: "rgba(20,80,20,0.3)", border: "1px solid rgba(20,120,20,0.3)" }}>
                        Mark Resolved
                      </button>
                    )}
                    {ticket.status === "resolved" && (
                      <button onClick={() => updateSupport(ticket.id, "open")}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans text-amber-400"
                        style={{ background: "rgba(80,50,10,0.3)", border: "1px solid rgba(101,67,20,0.3)" }}>
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(30,18,6,0.8)", border: "1px solid rgba(101,67,20,0.3)" }}>
            <div className="text-4xl mb-4">💳</div>
            <h2 className="text-amber-200 font-serif font-bold text-xl mb-2">Stripe Integration Pending</h2>
            <p className="text-amber-700/60 text-sm font-sans mb-6 max-w-md mx-auto">Payment processing will be enabled once Stripe registration is complete. Users will be able to subscribe for full access to all 9 interview phases.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {[
                { label: "Free Plan", desc: "Story Hook phase only (3 questions)", status: "Active" },
                { label: "Monthly Plan", desc: "All 9 phases + biography + family vault", status: "Pending Stripe" },
              ].map(plan => (
                <div key={plan.label} className="rounded-xl p-4" style={{ border: "1px solid rgba(101,67,20,0.3)", background: "rgba(15,10,4,0.6)" }}>
                  <p className="text-amber-200 font-serif font-semibold mb-1">{plan.label}</p>
                  <p className="text-amber-700/60 text-xs font-sans mb-2">{plan.desc}</p>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: plan.status === "Active" ? "rgba(20,80,20,0.4)" : "rgba(80,50,10,0.4)", color: plan.status === "Active" ? "#6ee7b7" : "#d4a017" }}>{plan.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
