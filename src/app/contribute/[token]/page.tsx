"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Check, Loader2, BookOpen } from "lucide-react";

interface InviteInfo {
  id: string;
  inviteeName: string | null;
  message: string | null;
  status: string;
  inviterName: string;
}

export default function ContributePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [story, setStory] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/invite/${token}`);
      if (!res.ok) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setInvite(data);
      if (data.inviteeName) setName(data.inviteeName);
      setLoading(false);
    })();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!story.trim() || !name.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contributorName: name, contributorEmail: email, relationship, story }),
    });
    setSubmitting(false);
    if (res.ok) setSubmitted(true);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0801" }}>
      <Loader2 size={28} className="animate-spin" style={{ color: "#c8843a" }} />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#0d0801" }}>
      <BookOpen size={40} style={{ color: "rgba(180,100,30,0.4)" }} className="mb-4" />
      <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "#f0d060" }}>Invite not found</h1>
      <p className="font-serif italic text-sm" style={{ color: "rgba(180,130,60,0.6)" }}>
        This link may have expired or already been used.
      </p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#0d0801" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)" }}>
        <Check size={28} color="white" />
      </div>
      <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "#f0d060" }}>Memory shared</h1>
      <p className="font-serif italic text-sm max-w-sm" style={{ color: "rgba(180,130,60,0.7)" }}>
        Thank you — your memory has been shared with {invite?.inviterName}. It will become part of their story.
      </p>
      <div className="mt-8 text-[11px] font-sans uppercase tracking-widest" style={{ color: "rgba(120,80,30,0.5)" }}>
        History Drift
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-5 py-10 flex flex-col items-center" style={{ background: "#0d0801" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] font-sans uppercase tracking-widest mb-3" style={{ color: "rgba(150,100,50,0.6)" }}>
            History Drift
          </div>
          <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: "#f0d060" }}>
            Share a memory
          </h1>
          <p className="font-serif italic text-sm" style={{ color: "rgba(200,150,70,0.75)" }}>
            {invite?.inviterName} is building their life story and invited you to contribute.
          </p>
          {invite?.message && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm font-serif italic text-left"
              style={{ background: "rgba(80,40,8,0.5)", border: "1px solid rgba(180,120,40,0.25)", color: "rgba(220,175,90,0.85)" }}>
              &ldquo;{invite.message}&rdquo;
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(180,130,60,0.6)" }}>Your name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="e.g. Sarah"
                className="w-full rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1"
                style={{ background: "rgba(20,12,4,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
            <div>
              <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5"
                style={{ color: "rgba(180,130,60,0.6)" }}>Relationship</label>
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. daughter, friend"
                className="w-full rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1"
                style={{ background: "rgba(20,12,4,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5"
              style={{ color: "rgba(180,130,60,0.6)" }}>Your email (optional)</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
              placeholder="so they can thank you"
              className="w-full rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:ring-1"
              style={{ background: "rgba(20,12,4,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
          </div>

          <div>
            <label className="block text-[11px] font-sans uppercase tracking-wider mb-1.5"
              style={{ color: "rgba(180,130,60,0.6)" }}>Your memory *</label>
            <textarea value={story} onChange={(e) => setStory(e.target.value)} required rows={8}
              placeholder={`Share a story, memory, or moment you remember about ${invite?.inviterName ?? "them"}. What stands out? What do you want them to know you remember?`}
              className="w-full rounded-xl px-4 py-3 text-sm font-sans resize-none focus:outline-none focus:ring-1"
              style={{ background: "rgba(20,12,4,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0",
                lineHeight: "1.7" }} />
            <div className="text-right text-[10px] mt-1" style={{ color: "rgba(120,80,30,0.5)" }}>
              {story.length} characters
            </div>
          </div>

          <button type="submit" disabled={submitting || !name.trim() || !story.trim()}
            className="w-full py-4 rounded-xl font-serif font-semibold text-base transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
            {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Share this memory →"}
          </button>
        </form>

        <p className="text-center text-[11px] font-sans mt-6" style={{ color: "rgba(100,70,25,0.45)" }}>
          No account needed · Your memory is shared only with {invite?.inviterName}
        </p>
      </div>
    </div>
  );
}
