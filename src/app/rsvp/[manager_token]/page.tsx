"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface EventInfo {
  id: string;
  honoree_name: string;
  title: string;
  description?: string;
  welcome_message?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue: string;
  address?: string;
  dress_information?: string;
  parking_information?: string;
  rsvp_deadline?: string;
  hero_images?: string[];
  wishes_token?: string | null;
}

type Step = "loading" | "error" | "form" | "done";

function fmt(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

const inputCls = "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

export default function GenericRsvpPage() {
  const { manager_token } = useParams<{ manager_token: string }>();

  const [step, setStep] = useState<Step>("loading");
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [response, setResponse] = useState<"yes" | "no" | "maybe">("yes");
  const [partyMembers, setPartyMembers] = useState<Array<{ first_name: string; last_name: string }>>([]);

  const [wishesToken, setWishesToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/rsvp/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setErrMsg(d.error); setStep("error"); return; }
        setEvent(d.event);
        setStep("form");
      })
      .catch(() => { setErrMsg("Failed to load invitation."); setStep("error"); });
  }, [manager_token]);

  const addPartyMember = () => setPartyMembers((p) => [...p, { first_name: "", last_name: "" }]);
  const removePartyMember = (i: number) => setPartyMembers((p) => p.filter((_, idx) => idx !== i));
  const updateMember = (i: number, field: "first_name" | "last_name", val: string) => {
    setPartyMembers((p) => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setSaving(true);
    setErrMsg("");
    try {
      const res = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager_token,
          first_name: firstName,
          last_name: lastName || undefined,
          email: email || undefined,
          mobile: mobile || undefined,
          response,
          party_members: partyMembers.filter((m) => m.first_name.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setWishesToken(data.wishes_token ?? null);
      setStep("done");
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const copyWishes = () => {
    const url = `${window.location.origin}/wishes/${wishesToken}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
        <p className="font-serif text-gold/40 animate-pulse text-sm">Loading invitation…</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
        <div className="text-center">
          <p className="font-serif text-[#f5ead8] text-lg mb-2">This link isn't valid</p>
          <p className="font-serif text-gold/40 text-sm">{errMsg}</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
        <div className="max-w-md w-full text-center flex flex-col gap-6">
          <div>
            <p className="text-4xl mb-4">🎉</p>
            <h1 className="font-serif text-2xl font-bold text-[#f5ead8] mb-2">You're all set!</h1>
            <p className="font-serif text-gold/60 text-sm leading-relaxed">
              Thank you for your RSVP. {event?.honoree_name && `We can't wait to celebrate ${event.honoree_name} together.`}
            </p>
          </div>
          {wishesToken && (
            <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
              <p className="font-serif text-sm font-semibold text-[#f5ead8]">🎂 Share the Best Wishes Link</p>
              <p className="font-serif text-xs text-[#f5ead8]/45 leading-relaxed">
                Know someone who can't make it? Send them this link so they can still wish {event?.honoree_name ?? "the guest of honour"} a happy birthday.
              </p>
              <button
                onClick={copyWishes}
                className="py-2 rounded-xl font-serif text-sm font-semibold transition-all"
                style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.25)", color: copied ? "#22c55e" : "rgba(212,160,23,0.8)" }}
              >
                {copied ? "✓ Copied!" : "Copy Best Wishes Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const heroImages = event?.hero_images?.filter(Boolean) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40 mb-2">You're invited</p>
          <h1 className="font-serif text-3xl font-bold text-[#f5ead8] chalk-text">
            {event?.honoree_name}
          </h1>
          {event?.title && event.title !== event.honoree_name && (
            <p className="font-serif text-gold/60 text-sm mt-1">{event.title}</p>
          )}
        </div>

        {/* Hero image */}
        {heroImages.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "#0f0a04" }}>
            <img src={heroImages[0]} alt={event?.honoree_name ?? ""}
              className="w-full" style={{ maxHeight: "280px", objectFit: "cover", objectPosition: "center top" }} />
          </div>
        )}

        {/* Event details */}
        <div className="warm-glass rounded-2xl p-5 mb-6 flex flex-col gap-0" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
          {event?.date && (
            <div className="flex gap-3 py-3 border-b border-gold/10">
              <span className="text-gold/50 text-sm mt-0.5">📅</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Date</p>
                <p className="font-serif text-[#f5ead8] text-sm">
                  {fmt(event.date)}
                  {event.start_time && ` · ${event.start_time}`}
                  {event.end_time && ` – ${event.end_time}`}
                </p>
              </div>
            </div>
          )}
          {event?.venue && (
            <div className="flex gap-3 py-3 border-b border-gold/10">
              <span className="text-gold/50 text-sm mt-0.5">📍</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Venue</p>
                <p className="font-serif text-[#f5ead8] text-sm">{event.venue}</p>
                {event.address && <p className="font-serif text-[#f5ead8]/50 text-xs mt-0.5">{event.address}</p>}
              </div>
            </div>
          )}
          {event?.dress_information && (
            <div className="flex gap-3 py-3 border-b border-gold/10">
              <span className="text-gold/50 text-sm mt-0.5">👗</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Dress Code</p>
                <p className="font-serif text-[#f5ead8] text-sm">{event.dress_information}</p>
              </div>
            </div>
          )}
          {event?.parking_information && (
            <div className="flex gap-3 py-3">
              <span className="text-gold/50 text-sm mt-0.5">🚗</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Parking</p>
                <p className="font-serif text-[#f5ead8] text-sm">{event.parking_information}</p>
              </div>
            </div>
          )}
        </div>

        {/* RSVP form */}
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Your name</p>
            <div className="flex gap-2">
              <input type="text" placeholder="First name *" value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required className={inputCls + " flex-1"} style={inputStyle} />
              <input type="text" placeholder="Last name" value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls + " flex-1"} style={inputStyle} />
            </div>
            <input type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls} style={inputStyle} />
            <input type="tel" placeholder="Mobile number (optional)" value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>

          {/* Attending */}
          <div className="warm-glass rounded-2xl p-5" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-3">Will you attend?</p>
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "maybe", "no"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setResponse(opt)}
                  className="py-3 rounded-xl font-serif text-sm font-semibold transition-all capitalize"
                  style={response === opt
                    ? { background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04" }
                    : { background: "rgba(212,160,23,0.07)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(245,234,216,0.6)" }
                  }
                >
                  {opt === "yes" ? "✓ Yes" : opt === "maybe" ? "~ Maybe" : "✗ No"}
                </button>
              ))}
            </div>
          </div>

          {/* Party members */}
          {response !== "no" && (
            <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Bringing anyone?</p>
              {partyMembers.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="First name" value={m.first_name}
                    onChange={(e) => updateMember(i, "first_name", e.target.value)}
                    className={inputCls + " flex-1"} style={inputStyle} />
                  <input type="text" placeholder="Last name" value={m.last_name}
                    onChange={(e) => updateMember(i, "last_name", e.target.value)}
                    className={inputCls + " flex-1"} style={inputStyle} />
                  <button type="button" onClick={() => removePartyMember(i)}
                    className="text-gold/30 hover:text-red-400 transition-colors font-serif text-lg flex-shrink-0 px-1">×</button>
                </div>
              ))}
              <button type="button" onClick={addPartyMember}
                className="text-sm font-serif py-2 rounded-xl transition-all"
                style={{ color: "rgba(212,160,23,0.6)", border: "1px dashed rgba(212,160,23,0.2)", background: "transparent" }}>
                + Add guest
              </button>
            </div>
          )}

          {errMsg && <p className="text-red-400 font-serif text-sm text-center">{errMsg}</p>}

          <button type="submit" disabled={saving || !firstName.trim()}
            className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)" }}>
            {saving ? "Sending…" : "Submit RSVP →"}
          </button>
        </form>

        <footer className="py-8 text-center">
          <p className="text-xs font-serif" style={{ color: "rgba(212,160,23,0.25)" }}>
            Powered by History Drift
          </p>
        </footer>
      </div>
    </div>
  );
}
