"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Guest {
  id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  mobile?: string;
}

interface Rsvp {
  response: "yes" | "no" | "maybe";
  dietary_restrictions?: string;
  song_request?: string;
  notes?: string;
  party_size?: number;
}

export default function RsvpPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [existing, setExisting] = useState<Rsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [response, setResponse] = useState<"yes" | "no" | "maybe">("yes");
  const [partySize, setPartySize] = useState(1);
  const [partyMembers, setPartyMembers] = useState<Array<{ name: string; dietary: string }>>([]);
  const [dietary, setDietary] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  useEffect(() => {
    fetch("/api/celebrate/invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        const g = d.guest;
        const r = d.rsvp;
        setGuest(g ?? null);
        if (g) {
          setEmail(g.email ?? "");
          setMobile(g.mobile ?? "");
        }
        if (r) {
          setExisting(r);
          setResponse(r.response ?? "yes");
          setPartySize(r.party_size ?? 1);
          setDietary(r.dietary_restrictions ?? "");
          setSongRequest(r.song_request ?? "");
          setNotes(r.notes ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (partySize <= 1) {
      setPartyMembers([]);
      return;
    }
    setPartyMembers((prev) => {
      const next = [...prev];
      while (next.length < partySize - 1) next.push({ name: "", dietary: "" });
      return next.slice(0, partySize - 1);
    });
  }, [partySize]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/celebrate/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          response,
          party_size: partySize,
          party_members: partyMembers,
          dietary_restrictions: dietary,
          song_request: songRequest,
          notes,
          email: email || undefined,
          mobile: mobile || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/celebrate/${token}/rsvp-confirmation`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(212,160,23,0.2)",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gold/40 font-serif text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text mb-1">
          {existing ? "Update Your RSVP" : "RSVP"}
        </h1>
        {guest && (
          <p className="text-sm font-serif text-gold/60">
            We're so glad you're coming, {guest.first_name}!
          </p>
        )}
      </div>

      {/* Attending? */}
      <div className="warm-glass rounded-2xl p-5">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-3">Will you attend?</p>
        <div className="grid grid-cols-3 gap-2">
          {(["yes", "maybe", "no"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setResponse(opt)}
              className="py-3 rounded-xl font-serif text-sm font-semibold transition-all capitalize"
              style={
                response === opt
                  ? { background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)", color: "#0f0a04" }
                  : { background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(245,234,216,0.6)" }
              }
            >
              {opt === "yes" ? "✓ Yes" : opt === "maybe" ? "~ Maybe" : "✗ No"}
            </button>
          ))}
        </div>
      </div>

      {/* Party size */}
      {response !== "no" && (
        <div className="warm-glass rounded-2xl p-5">
          <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-3">How many in your party?</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.max(1, n - 1))}
              className="w-10 h-10 rounded-full font-serif text-gold text-lg flex items-center justify-center transition-colors hover:bg-gold/10"
              style={{ border: "1px solid rgba(212,160,23,0.3)" }}
            >
              −
            </button>
            <span className="font-serif text-2xl text-[#f5ead8] min-w-[2ch] text-center">{partySize}</span>
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.min(20, n + 1))}
              className="w-10 h-10 rounded-full font-serif text-gold text-lg flex items-center justify-center transition-colors hover:bg-gold/10"
              style={{ border: "1px solid rgba(212,160,23,0.3)" }}
            >
              +
            </button>
          </div>

          {partyMembers.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Party members</p>
              {partyMembers.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Name of guest ${i + 2}`}
                    value={m.name}
                    onChange={(e) => {
                      const next = [...partyMembers];
                      next[i] = { ...next[i], name: e.target.value };
                      setPartyMembers(next);
                    }}
                    className={inputClass + " flex-1"}
                    style={inputStyle}
                  />
                  <input
                    type="text"
                    placeholder="Dietary needs"
                    value={m.dietary}
                    onChange={(e) => {
                      const next = [...partyMembers];
                      next[i] = { ...next[i], dietary: e.target.value };
                      setPartyMembers(next);
                    }}
                    className={inputClass}
                    style={{ ...inputStyle, width: "40%" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact details */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Your contact info</p>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
        <input
          type="tel"
          placeholder="Mobile number (optional)"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Dietary */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Your dietary restrictions</p>
        <input
          type="text"
          placeholder="e.g. vegetarian, nut allergy…"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Song request */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Song request</p>
        <input
          type="text"
          placeholder="What song gets you on the dance floor?"
          value={songRequest}
          onChange={(e) => setSongRequest(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Notes */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Message for the host</p>
        <textarea
          rows={3}
          placeholder="Anything else you'd like us to know?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass + " resize-none"}
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-red-400 font-serif text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
      >
        {saving ? "Sending…" : `${existing ? "Update" : "Submit"} RSVP →`}
      </button>
    </form>
  );
}
