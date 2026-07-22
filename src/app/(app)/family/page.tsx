"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Plus, Check, Loader2, Users, ChevronDown, ChevronUp, X } from "lucide-react";

interface Invite {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
  created_at: string;
  contributions: Contribution[];
}

interface Contribution {
  id: string;
  contributor_name: string;
  relationship: string | null;
  story: string;
  photo_urls: string[];
  created_at: string;
}

export default function FamilyPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const fetchInvites = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inviteRows } = await (supabase as any)
      .from("family_invites")
      .select("id, invitee_email, invitee_name, status, created_at")
      .order("created_at", { ascending: false });

    if (!inviteRows) { setLoading(false); return; }

    // Fetch contributions for each invite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: contribRows } = await (supabase as any)
      .from("family_contributions")
      .select("id, invite_id, contributor_name, relationship, story, photo_urls, created_at")
      .in("invite_id", inviteRows.map((i: Invite) => i.id));

    const withContribs = inviteRows.map((inv: Invite) => ({
      ...inv,
      contributions: (contribRows ?? []).filter((c: { invite_id: string }) => c.invite_id === inv.id),
    }));

    setInvites(withContribs);
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvites(); }, [fetchInvites]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);

    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/invite/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ inviteeEmail: email, inviteeName: name, message }),
    });

    setSending(false);
    setSent(true);
    setEmail(""); setName(""); setMessage("");
    setTimeout(() => { setSent(false); setShowForm(false); fetchInvites(); }, 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={24} className="animate-spin" style={{ color: "#c8843a" }} />
    </div>
  );

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-bold text-xl" style={{ color: "#f0d060" }}>Family Memories</h1>
          <p className="font-serif italic text-xs mt-0.5" style={{ color: "rgba(180,130,60,0.65)" }}>
            Invite family and friends to contribute their memories to your story.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-sans text-sm font-semibold transition-all"
          style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
          <Plus size={14} /> Invite
        </button>
      </div>

      {/* Send invite form */}
      {showForm && (
        <form onSubmit={sendInvite}
          className="mb-6 p-5 rounded-2xl space-y-4"
          style={{ background: "rgba(20,10,4,0.8)", border: "1px solid rgba(120,60,160,0.3)" }}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif font-semibold text-sm" style={{ color: "#e8d080" }}>New invite</span>
            <button type="button" onClick={() => setShowForm(false)}>
              <X size={14} style={{ color: "rgba(225,185,80,0.88)" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(180,130,60,0.55)" }}>Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email"
                placeholder="family@example.com"
                className="w-full rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none"
                style={{ background: "rgba(10,6,2,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(180,130,60,0.55)" }}>Their name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aunt Rose"
                className="w-full rounded-xl px-3 py-2.5 text-sm font-sans focus:outline-none"
                style={{ background: "rgba(10,6,2,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-wider mb-1.5"
              style={{ color: "rgba(180,130,60,0.55)" }}>Personal message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
              placeholder="Ask them to share a specific memory..."
              className="w-full rounded-xl px-3 py-2.5 text-sm font-sans resize-none focus:outline-none"
              style={{ background: "rgba(10,6,2,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
          </div>
          <button type="submit" disabled={sending || sent || !email.trim()}
            className="w-full py-3 rounded-xl font-serif font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: sent ? "rgba(40,140,60,0.8)" : "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
            {sent ? <><Check size={14} /> Invite sent!</> : sending ? <Loader2 size={14} className="animate-spin" /> : <><Mail size={14} /> Send invite</>}
          </button>
        </form>
      )}

      {/* Invite list */}
      {invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={36} style={{ color: "rgba(150,100,40,0.3)" }} className="mb-4" />
          <p className="font-serif italic text-sm" style={{ color: "rgba(225,185,80,0.88)" }}>
            No invites yet. Invite a family member or friend to share a memory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((inv) => (
            <div key={inv.id} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(16,9,3,0.8)", border: `1px solid ${inv.contributions.length > 0 ? "rgba(80,160,80,0.3)" : "rgba(100,65,20,0.25)"}` }}>
              {/* Invite row */}
              <button onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-serif font-bold text-sm"
                  style={{ background: "rgba(40,20,5,0.8)", color: "#c8843a", border: "1px solid rgba(120,70,20,0.35)" }}>
                  {(inv.invitee_name ?? inv.invitee_email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-sm font-semibold truncate" style={{ color: "#e8d080" }}>
                    {inv.invitee_name ?? inv.invitee_email}
                  </div>
                  <div className="text-[10px] font-sans truncate" style={{ color: "rgba(220,175,80,0.92)" }}>
                    {inv.invitee_name ? inv.invitee_email + " · " : ""}
                    {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold uppercase"
                    style={{
                      background: inv.contributions.length > 0 ? "rgba(40,120,40,0.25)" : "rgba(60,40,10,0.5)",
                      color: inv.contributions.length > 0 ? "rgba(100,200,100,0.9)" : "rgba(220,175,80,0.95)",
                    }}>
                    {inv.contributions.length > 0 ? `${inv.contributions.length} memory` : "pending"}
                  </span>
                  {expanded === inv.id ? <ChevronUp size={12} style={{ color: "rgba(220,175,80,0.88)" }} />
                    : <ChevronDown size={12} style={{ color: "rgba(220,175,80,0.88)" }} />}
                </div>
              </button>

              {/* Contributions */}
              {expanded === inv.id && inv.contributions.length > 0 && (
                <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(80,50,15,0.25)" }}>
                  {inv.contributions.map((c) => (
                    <div key={c.id} className="pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-serif font-semibold text-xs" style={{ color: "#c8a050" }}>{c.contributor_name}</span>
                        {c.relationship && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(60,35,8,0.6)", color: "rgba(225,185,80,0.95)" }}>
                            {c.relationship}
                          </span>
                        )}
                        <span className="text-[9px] font-sans ml-auto" style={{ color: "rgba(120,85,30,0.5)" }}>
                          {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <p className="font-serif text-sm leading-relaxed mb-3" style={{ color: "rgba(220,190,130,0.85)" }}>
                        {c.story}
                      </p>
                      {c.photo_urls?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {c.photo_urls.map((url, pi) => (
                            <a key={pi} href={url} target="_blank" rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden flex-shrink-0 hover:opacity-90 transition-opacity"
                              style={{ width: 80, height: 80 }}>
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {expanded === inv.id && inv.contributions.length === 0 && (
                <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: "rgba(80,50,15,0.2)" }}>
                  <p className="font-serif italic text-xs" style={{ color: "rgba(140,100,40,0.5)" }}>
                    Waiting for their response...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
