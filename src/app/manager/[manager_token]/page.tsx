"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ManagerRecord {
  id: string;
  email: string;
  name: string | null;
}

interface EventInfo {
  id: string;
  honoree_name: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  venue: string;
  address?: string;
  hero_images?: string[];
  wishes_token?: string | null;
  rsvp_deadline?: string;
}

interface PartyMember {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface Rsvp {
  response: "yes" | "no" | "maybe";
  party_size: number;
  created_at: string;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  invitation_token: string;
  via_generic_rsvp: boolean;
  manager_id: string | null;
  celebration_rsvps: Rsvp[];
  celebration_guest_party: PartyMember[];
}

const inputCls = "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

function RsvpBadge({ guest }: { guest: Guest }) {
  const r = guest.celebration_rsvps?.[0]?.response;
  if (!r) return <span className="text-xs font-serif px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(245,234,216,0.3)" }}>No reply</span>;
  const map = {
    yes: { bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Attending" },
    no: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Declined" },
    maybe: { bg: "rgba(234,179,8,0.15)", color: "#eab308", label: "Maybe" },
  };
  const s = map[r];
  return <span className="text-xs font-serif px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

export default function ManagerPage() {
  const { manager_token } = useParams<{ manager_token: string }>();
  const APP_URL = typeof window !== "undefined" ? window.location.origin : "";

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [manager, setManager] = useState<ManagerRecord | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addingGuest, setAddingGuest] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const [copiedRsvp, setCopiedRsvp] = useState(false);
  const [copiedWishes, setCopiedWishes] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({});

  const fetchGuests = useCallback(() => {
    fetch("/api/manager/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: manager_token, action: "list" }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.guests) setGuests(d.guests); })
      .catch(() => {});
  }, [manager_token]);

  useEffect(() => {
    fetch("/api/manager/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: manager_token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setErrMsg(d.error); setLoading(false); return; }
        setManager(d.manager);
        setEvent(d.event);
        setInvitationToken(d.invitation_token ?? null);
        setLoading(false);
        fetchGuests();
      })
      .catch(() => { setErrMsg("Failed to load."); setLoading(false); });
  }, [manager_token, fetchGuests]);

  const myGuests = guests.filter((g) => g.manager_id === manager?.id);
  const myGuestsAttending = myGuests.filter((g) => g.celebration_rsvps?.[0]?.response === "yes");
  const myPartyTotal = myGuestsAttending.reduce((sum, g) => sum + (g.celebration_rsvps?.[0]?.party_size ?? 1), 0);

  const rsvpUrl = `${APP_URL}/rsvp/${manager_token}`;
  const wishesUrl = event?.wishes_token ? `${APP_URL}/wishes/${event.wishes_token}` : null;

  const copyRsvpLink = () => {
    navigator.clipboard?.writeText(rsvpUrl);
    setCopiedRsvp(true);
    setTimeout(() => setCopiedRsvp(false), 2500);
  };

  const copyWishesLink = () => {
    if (!wishesUrl) return;
    navigator.clipboard?.writeText(wishesUrl);
    setCopiedWishes(true);
    setTimeout(() => setCopiedWishes(false), 2500);
  };

  const shareRsvpEmail = () => {
    const honoree = event?.honoree_name ?? "the celebration";
    const subject = encodeURIComponent(`You're invited — ${honoree}'s Celebration`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd love for you to join us for ${honoree}'s celebration!\n\nClick the link below to see the event details and RSVP:\n\n${rsvpUrl}\n\nHope to see you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareRsvpSms = () => {
    const honoree = event?.honoree_name ?? "a celebration";
    const body = encodeURIComponent(`You're invited to ${honoree}'s celebration! RSVP here: ${rsvpUrl}`);
    window.open(`sms:?body=${body}`);
  };

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirst.trim()) return;
    setAddSaving(true);
    setAddError("");
    try {
      const res = await fetch("/api/manager/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manager_token, action: "add_guest", first_name: newFirst, last_name: newLast, email: newEmail, mobile: newMobile }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setNewFirst(""); setNewLast(""); setNewEmail(""); setNewMobile("");
      setAddingGuest(false);
      fetchGuests();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAddSaving(false);
    }
  };

  const sendReminder = async (guest: Guest) => {
    if (!guest.email) { alert("No email on file for this guest."); return; }
    setSendingReminder(guest.id);
    try {
      await fetch("/api/manager/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: manager_token, action: "send_reminder", guest_id: guest.id, method: "email" }),
      });
      setReminderSent((p) => ({ ...p, [guest.id]: true }));
    } catch {
      /* silently fail */
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
        <p className="font-serif text-gold/40 animate-pulse text-sm">Loading…</p>
      </div>
    );
  }

  if (errMsg || !manager || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
        <p className="font-serif text-[#f5ead8]/60 text-center">{errMsg || "Invalid manager link."}</p>
      </div>
    );
  }

  const heroImages = event.hero_images?.filter(Boolean) ?? [];
  const eventDate = event.date
    ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen relative" style={{ background: "linear-gradient(160deg,#0f0a04,#1c1208)" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-50 warm-glass border-b border-gold">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-serif text-gold">✦</span>
            <span className="font-serif text-sm font-semibold text-[#f5ead8]">
              {event.honoree_name}&apos;s Celebration
            </span>
          </div>
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-serif text-xs font-semibold transition-all"
            style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04" }}
          >
            <span>👥</span>
            <span>My Guests</span>
            <span className="ml-0.5 font-bold">{myGuests.length}</span>
          </button>
        </div>
      </header>

      {/* Celebration view */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-4">
        {heroImages.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0f0a04" }}>
            <img src={heroImages[0]} alt={event.honoree_name}
              className="w-full" style={{ maxHeight: "320px", objectFit: "cover", objectPosition: "center top" }} />
          </div>
        )}

        <div className="text-center">
          <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40 mb-2">Celebrating</p>
          <h1 className="font-serif text-3xl font-bold text-[#f5ead8] chalk-text">{event.honoree_name}</h1>
        </div>

        {/* Event details */}
        <div className="warm-glass rounded-2xl p-5 flex flex-col gap-0" style={{ border: "1px solid rgba(212,160,23,0.15)" }}>
          {eventDate && (
            <div className="flex gap-3 py-3 border-b border-gold/10">
              <span className="text-gold/50 text-sm mt-0.5">📅</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Date</p>
                <p className="font-serif text-[#f5ead8] text-sm">
                  {eventDate}
                  {event.start_time && ` · ${event.start_time}`}
                  {event.end_time && ` – ${event.end_time}`}
                </p>
              </div>
            </div>
          )}
          {event.venue && (
            <div className="flex gap-3 py-3">
              <span className="text-gold/50 text-sm mt-0.5">📍</span>
              <div>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">Venue</p>
                <p className="font-serif text-[#f5ead8] text-sm">{event.venue}</p>
                {event.address && <p className="font-serif text-[#f5ead8]/50 text-xs mt-0.5">{event.address}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Share RSVP link — copy + email + SMS */}
        <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
          <p className="font-serif text-sm font-semibold text-[#f5ead8]">📲 Share Your RSVP Link</p>
          <p className="font-serif text-xs text-[#f5ead8]/45 leading-relaxed">
            Send your personal RSVP link to the people you&apos;re inviting. They&apos;ll see full event details and can RSVP directly.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={copyRsvpLink}
              className="py-2.5 rounded-xl font-serif text-xs font-semibold transition-all"
              style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: copiedRsvp ? "#22c55e" : "rgba(212,160,23,0.8)" }}
            >
              {copiedRsvp ? "✓ Copied" : "🔗 Copy"}
            </button>
            <button
              onClick={shareRsvpEmail}
              className="py-2.5 rounded-xl font-serif text-xs font-semibold transition-all"
              style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: "rgba(212,160,23,0.8)" }}
            >
              ✉️ Email
            </button>
            <button
              onClick={shareRsvpSms}
              className="py-2.5 rounded-xl font-serif text-xs font-semibold transition-all"
              style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: "rgba(212,160,23,0.8)" }}
            >
              💬 Text
            </button>
          </div>
        </div>

        {/* Share Your Story */}
        {invitationToken && (
          <Link
            href={`/celebrate/${invitationToken}/share-memory`}
            className="warm-glass rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-gold/40"
            style={{ border: "1px solid rgba(212,160,23,0.2)", textDecoration: "none" }}
          >
            <span className="text-2xl flex-shrink-0">📸</span>
            <div className="flex-1">
              <p className="font-serif text-sm font-semibold text-[#f5ead8]">Share Your Story</p>
              <p className="font-serif text-xs text-[#f5ead8]/45 mt-0.5 leading-relaxed">
                Share a photo, memory, or video message for {event.honoree_name}.
              </p>
            </div>
            <span className="text-gold/30 flex-shrink-0 font-serif">→</span>
          </Link>
        )}

        {/* Best Wishes */}
        {wishesUrl && (
          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl flex-shrink-0">🎂</span>
              <div className="flex-1">
                <p className="font-serif text-sm font-semibold text-[#f5ead8]">Best Wishes</p>
                <p className="font-serif text-xs text-[#f5ead8]/45 mt-0.5 leading-relaxed">
                  Send wishes directly, or share the link with people who can&apos;t attend.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href={wishesUrl}
                className="py-2.5 rounded-xl font-serif text-xs font-semibold text-center transition-all"
                style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04", textDecoration: "none" }}
              >
                Send Wishes
              </Link>
              <button
                onClick={copyWishesLink}
                className="py-2.5 rounded-xl font-serif text-xs font-semibold transition-all"
                style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: copiedWishes ? "#22c55e" : "rgba(212,160,23,0.8)" }}
              >
                {copiedWishes ? "✓ Copied" : "🔗 Copy"}
              </button>
              <button
                onClick={() => {
                  const body = encodeURIComponent(`Send your best wishes to ${event.honoree_name}: ${wishesUrl}`);
                  window.open(`sms:?body=${body}`);
                }}
                className="py-2.5 rounded-xl font-serif text-xs font-semibold transition-all"
                style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: "rgba(212,160,23,0.8)" }}
              >
                💬 Text
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Manager Panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,10,4,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="flex-1 overflow-y-auto max-w-2xl w-full mx-auto px-4 py-4 flex flex-col gap-4">
            {/* Panel header */}
            <div className="flex items-center justify-between sticky top-0 py-3 z-10" style={{ background: "rgba(15,10,4,0.9)" }}>
              <div>
                <h2 className="font-serif text-lg font-bold text-[#f5ead8]">Guest Manager</h2>
                <p className="font-serif text-xs text-gold/50 mt-0.5">
                  {myGuests.length} invited · {myGuestsAttending.length} attending · {myPartyTotal} total in party
                </p>
              </div>
              <button onClick={() => setPanelOpen(false)}
                className="text-gold/40 hover:text-gold transition-colors font-serif text-2xl leading-none p-1">×</button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Invited", val: myGuests.length, color: "rgba(212,160,23,0.8)" },
                { label: "Attending", val: myGuestsAttending.length, color: "#22c55e" },
                { label: "No Reply", val: myGuests.filter((g) => !g.celebration_rsvps?.length).length, color: "rgba(245,234,216,0.3)" },
              ].map(({ label, val, color }) => (
                <div key={label} className="warm-glass rounded-xl p-3 text-center" style={{ border: "1px solid rgba(212,160,23,0.1)" }}>
                  <p className="font-serif text-2xl font-bold" style={{ color }}>{val}</p>
                  <p className="font-serif text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "rgba(245,234,216,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Add guest / RSVP link buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setAddingGuest((p) => !p)}
                className="flex-1 py-2.5 rounded-xl font-serif text-sm font-semibold transition-all"
                style={addingGuest
                  ? { background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.4)", color: "rgba(212,160,23,0.9)" }
                  : { background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04" }
                }
              >
                {addingGuest ? "Cancel" : "+ Add Guest"}
              </button>
              <button
                onClick={copyRsvpLink}
                className="flex-1 py-2.5 rounded-xl font-serif text-sm font-semibold transition-all"
                style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.25)", color: copiedRsvp ? "#22c55e" : "rgba(212,160,23,0.7)" }}
              >
                {copiedRsvp ? "✓ Copied!" : "📲 Copy RSVP"}
              </button>
            </div>

            {/* Add guest form */}
            {addingGuest && (
              <form onSubmit={addGuest} className="warm-glass rounded-2xl p-4 flex flex-col gap-3" style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
                <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">New Guest</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="First name *" value={newFirst} onChange={(e) => setNewFirst(e.target.value)}
                    required className={inputCls + " flex-1"} style={inputStyle} />
                  <input type="text" placeholder="Last name" value={newLast} onChange={(e) => setNewLast(e.target.value)}
                    className={inputCls + " flex-1"} style={inputStyle} />
                </div>
                <input type="email" placeholder="Email (to send invite)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  className={inputCls} style={inputStyle} />
                <input type="tel" placeholder="Mobile (optional)" value={newMobile} onChange={(e) => setNewMobile(e.target.value)}
                  className={inputCls} style={inputStyle} />
                {addError && <p className="text-red-400 font-serif text-xs">{addError}</p>}
                <button type="submit" disabled={addSaving || !newFirst.trim()}
                  className="py-2.5 rounded-xl font-serif text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04" }}>
                  {addSaving ? "Adding…" : "Add Guest"}
                </button>
              </form>
            )}

            {/* Guest list */}
            <div className="flex flex-col gap-2 pb-8">
              {myGuests.length === 0 && (
                <p className="font-serif text-sm text-[#f5ead8]/30 text-center py-8">
                  No guests yet. Add a guest or share your RSVP link.
                </p>
              )}
              {myGuests.map((g) => {
                const isExpanded = expandedId === g.id;
                const hasRsvp = g.celebration_rsvps?.length > 0;
                const partyCount = g.celebration_guest_party?.length ?? 0;

                return (
                  <div key={g.id} className="warm-glass rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.1)" }}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : g.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-[#f5ead8] truncate font-semibold">
                          {g.first_name} {g.last_name ?? ""}
                          {partyCount > 0 && <span className="text-xs text-gold/50 ml-2">+{partyCount}</span>}
                        </p>
                        {g.email && <p className="font-serif text-xs text-[#f5ead8]/35 truncate mt-0.5">{g.email}</p>}
                        {g.via_generic_rsvp && <p className="font-serif text-[10px] text-gold/30 mt-0.5">via RSVP link</p>}
                      </div>
                      <RsvpBadge guest={g} />
                      <span className="text-gold/25 font-serif text-sm ml-1">{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 flex flex-col gap-3 border-t border-gold/10">
                        {partyCount > 0 && (
                          <div className="pt-3">
                            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/35 mb-2">Their party</p>
                            <div className="flex flex-col gap-1.5">
                              {g.celebration_guest_party.map((pm) => (
                                <p key={pm.id} className="font-serif text-sm text-[#f5ead8]/70">
                                  {pm.first_name} {pm.last_name ?? ""}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1 flex-wrap">
                          {!hasRsvp && g.email && (
                            <button
                              disabled={sendingReminder === g.id || reminderSent[g.id]}
                              onClick={() => sendReminder(g)}
                              className="px-3 py-1.5 rounded-lg font-serif text-xs transition-all disabled:opacity-50"
                              style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)", color: reminderSent[g.id] ? "#22c55e" : "rgba(212,160,23,0.7)" }}
                            >
                              {sendingReminder === g.id ? "Sending…" : reminderSent[g.id] ? "✓ Reminder Sent" : "📧 Send Reminder"}
                            </button>
                          )}
                          <a
                            href={`${APP_URL}/celebrate/${g.invitation_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg font-serif text-xs transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(245,234,216,0.4)", textDecoration: "none" }}
                          >
                            View Invite →
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
