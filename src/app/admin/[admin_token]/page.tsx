"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

type Tab = "overview" | "guests" | "memories" | "carousel" | "admins";
type RsvpResponse = "yes" | "no" | "maybe";

interface AdminRecord { id: string; email: string; name: string | null; admin_token: string; is_active: boolean; is_super: boolean; last_accessed_at: string | null; created_at: string; }
interface EventInfo { id: string; title: string; honoree_name: string; date: string; venue: string; address?: string; wishes_token?: string | null; }
interface Guest { id: string; first_name: string; last_name?: string | null; email?: string | null; mobile?: string | null; invitation_token: string; celebration_rsvps?: Array<{ response: RsvpResponse; party_size?: number; dietary_restrictions?: string; notes?: string; }>; }
interface Memory { id: string; storyteller_name: string; relationship?: string; title?: string; story_text?: string; status: string; created_at: string; celebration_memory_media?: Array<{ id: string; media_type: string; file_url: string; caption?: string; carousel_approved?: boolean; carousel_order?: number; }>; }
interface CarouselMedia { id: string; media_type: string; file_url: string; caption: string; carousel_approved: boolean; carousel_order: number; celebration_memories?: { storyteller_name: string } | null; }

const RSVP_BADGE: Record<RsvpResponse, { label: string; color: string }> = {
  yes: { label: "Coming ✓", color: "#22c55e" },
  no:  { label: "Declined ✗", color: "#ef4444" },
  maybe: { label: "Maybe ~", color: "#f59e0b" },
};

function badge(text: string, color: string) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full font-serif text-[10px] font-semibold"
      style={{ background: color + "22", color }}>
      {text}
    </span>
  );
}

export default function AdminDashboard() {
  const { admin_token } = useParams<{ admin_token: string }>();

  const [admin, setAdmin] = useState<AdminRecord | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [origin, setOrigin] = useState("");

  // Guests
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ first_name: "", last_name: "", email: "", mobile: "" });
  const [addingGuest, setAddingGuest] = useState(false);
  const [addGuestError, setAddGuestError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Memories
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memFilter, setMemFilter] = useState("all");
  const [updatingMemory, setUpdatingMemory] = useState<string | null>(null);

  // Carousel
  const [carouselMedia, setCarouselMedia] = useState<CarouselMedia[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [carouselSaved, setCarouselSaved] = useState(false);

  // Admins
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [copiedAdminToken, setCopiedAdminToken] = useState<string | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: admin_token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setDenied(true); return; }
        setAdmin(d.admin);
        setEvent(d.event);
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [admin_token]);

  const api = useCallback((route: string, body: object) =>
    fetch(route, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: admin_token, ...body }) }).then((r) => r.json()),
  [admin_token]);

  const loadGuests = useCallback(async () => {
    setGuestsLoading(true);
    const d = await api("/api/admin/guests", { action: "list" });
    setGuests(d.guests ?? []);
    setGuestsLoading(false);
  }, [api]);

  const loadMemories = useCallback(async (filter = memFilter) => {
    setMemoriesLoading(true);
    const d = await api("/api/admin/memories", { action: "list", status_filter: filter });
    setMemories(d.memories ?? []);
    setMemoriesLoading(false);
  }, [api, memFilter]);

  const loadCarousel = useCallback(async () => {
    setCarouselLoading(true);
    const d = await api("/api/admin/memories", { action: "carousel_list" });
    setCarouselMedia(d.media ?? []);
    setCarouselLoading(false);
  }, [api]);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    const d = await api("/api/admin/admins", { action: "list" });
    setAdmins(d.admins ?? []);
    setAdminsLoading(false);
  }, [api]);

  useEffect(() => {
    if (!admin) return;
    if (tab === "guests") loadGuests();
    if (tab === "memories") loadMemories();
    if (tab === "carousel") loadCarousel();
    if (tab === "admins" && admin.is_super) loadAdmins();
    if (tab === "overview") { loadGuests(); loadMemories("all"); }
  }, [tab, admin]); // eslint-disable-line react-hooks/exhaustive-deps

  const addGuest = async () => {
    if (!newGuest.first_name.trim()) { setAddGuestError("First name required"); return; }
    setAddingGuest(true); setAddGuestError("");
    const d = await api("/api/admin/guests", { action: "create", ...newGuest });
    if (d.error) { setAddGuestError(d.error); setAddingGuest(false); return; }
    setGuests((prev) => [...prev, d.guest]);
    setNewGuest({ first_name: "", last_name: "", email: "", mobile: "" });
    setShowAddGuest(false);
    setAddingGuest(false);
  };

  const deleteGuest = async (id: string) => {
    if (!confirm("Remove this guest?")) return;
    await api("/api/admin/guests", { action: "delete", guest_id: id });
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const updateMemoryStatus = async (id: string, status: string) => {
    setUpdatingMemory(id);
    await api("/api/admin/memories", { action: "update_status", memory_id: id, status });
    setMemories((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    setUpdatingMemory(null);
  };

  const toggleCarousel = (id: string) => {
    setCarouselMedia((prev) => prev.map((m) => m.id === id ? { ...m, carousel_approved: !m.carousel_approved } : m));
  };

  const moveCarousel = (id: string, dir: -1 | 1) => {
    setCarouselMedia((prev) => {
      const approved = prev.filter((m) => m.carousel_approved).sort((a, b) => a.carousel_order - b.carousel_order);
      const idx = approved.findIndex((m) => m.id === id);
      if (idx < 0) return prev;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= approved.length) return prev;
      const next = [...prev];
      const a = next.find((m) => m.id === approved[idx].id)!;
      const b = next.find((m) => m.id === approved[swapIdx].id)!;
      [a.carousel_order, b.carousel_order] = [b.carousel_order, a.carousel_order];
      return [...next];
    });
  };

  const saveCarousel = async () => {
    setSavingCarousel(true);
    await Promise.all(carouselMedia.map((m) =>
      api("/api/admin/memories", { action: "carousel_update", media_id: m.id, carousel_approved: m.carousel_approved, carousel_order: m.carousel_order })
    ));
    setSavingCarousel(false);
    setCarouselSaved(true);
    setTimeout(() => setCarouselSaved(false), 2000);
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    const d = await api("/api/admin/admins", { action: "create", email: newAdminEmail, name: newAdminName });
    if (!d.error) {
      setAdmins((prev) => [...prev, d.admin]);
      setNewAdminEmail(""); setNewAdminName("");
    }
    setAddingAdmin(false);
  };

  const toggleAdmin = async (id: string) => {
    const d = await api("/api/admin/admins", { action: "toggle", target_id: id });
    setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, is_active: d.is_active } : a));
  };

  const copyInviteLink = (token: string) => {
    navigator.clipboard?.writeText(`${origin}/celebrate/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const copyAdminLink = (token: string) => {
    navigator.clipboard?.writeText(`${origin}/admin/${token}`);
    setCopiedAdminToken(token);
    setTimeout(() => setCopiedAdminToken(null), 2000);
  };

  const emailInvite = (g: Guest) => {
    const url = `${origin}/celebrate/${g.invitation_token}`;
    const subject = encodeURIComponent(`You're invited: ${event?.title ?? "Celebration"}`);
    const body = encodeURIComponent(`Hi ${g.first_name},\n\nYou're invited to celebrate ${event?.honoree_name ?? ""}! Click the link below to RSVP and share memories:\n\n${url}\n\nWe hope to see you there!`);
    window.open(`mailto:${g.email ?? ""}?subject=${subject}&body=${body}`);
  };

  const smsInvite = (g: Guest) => {
    const url = `${origin}/celebrate/${g.invitation_token}`;
    window.open(`sms:${g.mobile ?? ""}?body=${encodeURIComponent(`Hi ${g.first_name}! You're invited to celebrate ${event?.honoree_name ?? ""}. RSVP here: ${url}`)}`);
  };

  const inputCls = "w-full px-3 py-2 rounded-lg font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

  // ── Loading / access denied ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <p className="font-serif text-sm text-gold/40 animate-pulse">Verifying access…</p>
    </div>
  );

  if (denied || !admin) return (
    <div className="text-center py-24">
      <p className="font-serif text-2xl text-gold/50 mb-2">Access Denied</p>
      <p className="font-serif text-sm text-[#f5ead8]/30">This admin link is invalid or has been deactivated.</p>
    </div>
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const confirmed = guests.filter((g) => g.celebration_rsvps?.[0]?.response === "yes").length;
  const declined  = guests.filter((g) => g.celebration_rsvps?.[0]?.response === "no").length;
  const maybe     = guests.filter((g) => g.celebration_rsvps?.[0]?.response === "maybe").length;
  const pending   = guests.filter((g) => !g.celebration_rsvps?.length).length;
  const pendingMem = memories.filter((m) => m.status === "submitted").length;

  // ── Tab content ──────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; show?: boolean }[] = [
    { id: "overview",  label: "Overview" },
    { id: "guests",    label: `Guests${guests.length ? ` (${guests.length})` : ""}` },
    { id: "memories",  label: `Memories${pendingMem ? ` ·${pendingMem}` : ""}` },
    { id: "carousel",  label: "Carousel" },
    { id: "admins",    label: "Admins", show: admin.is_super },
  ].filter((t) => t.show !== false);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="warm-glass rounded-2xl p-5 flex items-center justify-between gap-3">
        <div>
          <p className="font-serif text-xs text-gold/40 uppercase tracking-widest mb-0.5">Admin Dashboard</p>
          <h1 className="font-serif text-lg font-bold text-[#f5ead8]">{event?.title ?? "Celebration"}</h1>
          <p className="font-serif text-xs text-gold/50 mt-0.5">
            Signed in as {admin.name ?? admin.email}
            {admin.is_super && " · Super Admin"}
          </p>
        </div>
        {event?.wishes_token && (
          <button
            onClick={() => { navigator.clipboard?.writeText(`${origin}/wishes/${event.wishes_token}`); }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-serif text-xs"
            style={{ background: "rgba(212,160,23,0.1)", color: "rgba(212,160,23,0.7)" }}
          >
            🎂 Copy Wishes Link
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 px-4 py-2 rounded-xl font-serif text-sm transition-all"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,#d4a017,#c8843a)", color: "#0f0a04", fontWeight: 600 }
              : { background: "rgba(212,160,23,0.06)", color: "rgba(245,234,216,0.5)", border: "1px solid rgba(212,160,23,0.12)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Confirmed", n: confirmed, color: "#22c55e" },
              { label: "Declined",  n: declined,  color: "#ef4444" },
              { label: "Maybe",     n: maybe,     color: "#f59e0b" },
              { label: "No Reply",  n: pending,   color: "rgba(212,160,23,0.4)" },
            ].map(({ label, n, color }) => (
              <div key={label} className="warm-glass rounded-2xl p-4 text-center">
                <p className="font-serif text-3xl font-bold" style={{ color }}>{n}</p>
                <p className="font-serif text-xs mt-1" style={{ color: "rgba(245,234,216,0.45)" }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="warm-glass rounded-2xl p-4 text-center">
              <p className="font-serif text-3xl font-bold text-gold/80">{guests.length}</p>
              <p className="font-serif text-xs text-[#f5ead8]/40 mt-1">Total Invited</p>
            </div>
            <div className="warm-glass rounded-2xl p-4 text-center">
              <p className="font-serif text-3xl font-bold text-gold/80">{memories.length}</p>
              <p className="font-serif text-xs text-[#f5ead8]/40 mt-1">
                Memories{pendingMem > 0 ? ` · ${pendingMem} pending` : ""}
              </p>
            </div>
          </div>
          {event && (
            <div className="warm-glass rounded-2xl p-5">
              <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40 mb-3">Event Details</p>
              {[
                { label: "Date", value: event.date ? new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
                { label: "Venue", value: event.venue },
                { label: "Address", value: event.address ?? "—" },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex gap-3 py-2 border-b border-gold/10 last:border-0">
                  <span className="font-serif text-[10px] uppercase tracking-widest text-gold/30 w-16 flex-shrink-0 mt-0.5">{label}</span>
                  <span className="font-serif text-sm text-[#f5ead8]/70">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GUESTS ───────────────────────────────────────────────────────── */}
      {tab === "guests" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-serif text-sm text-[#f5ead8]/60">{guests.length} guest{guests.length !== 1 ? "s" : ""} invited</p>
            <button onClick={() => setShowAddGuest((v) => !v)}
              className="px-4 py-2 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)" }}>
              + Add Guest
            </button>
          </div>

          {showAddGuest && (
            <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
              <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40">New Guest</p>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First name *" value={newGuest.first_name} onChange={(e) => setNewGuest((p) => ({ ...p, first_name: e.target.value }))} className={inputCls} style={inputStyle} />
                <input placeholder="Last name" value={newGuest.last_name} onChange={(e) => setNewGuest((p) => ({ ...p, last_name: e.target.value }))} className={inputCls} style={inputStyle} />
              </div>
              <input type="email" placeholder="Email address" value={newGuest.email} onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))} className={inputCls} style={inputStyle} />
              <input type="tel" placeholder="Mobile number" value={newGuest.mobile} onChange={(e) => setNewGuest((p) => ({ ...p, mobile: e.target.value }))} className={inputCls} style={inputStyle} />
              {addGuestError && <p className="text-red-400 font-serif text-xs">{addGuestError}</p>}
              <div className="flex gap-2">
                <button onClick={addGuest} disabled={addingGuest}
                  className="flex-1 py-2 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)" }}>
                  {addingGuest ? "Adding…" : "Add Guest"}
                </button>
                <button onClick={() => setShowAddGuest(false)}
                  className="px-4 py-2 rounded-xl font-serif text-sm text-[#f5ead8]/40 hover:text-[#f5ead8]/70 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {guestsLoading ? (
            <p className="font-serif text-sm text-gold/30 text-center py-8 animate-pulse">Loading…</p>
          ) : guests.length === 0 ? (
            <p className="font-serif text-sm text-gold/30 text-center py-12">No guests yet. Add the first one above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {guests.map((g) => {
                const rsvp = g.celebration_rsvps?.[0];
                const inviteUrl = `${origin}/celebrate/${g.invitation_token}`;
                return (
                  <div key={g.id} className="warm-glass rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-serif font-semibold text-[#f5ead8]">
                          {g.first_name} {g.last_name ?? ""}
                        </p>
                        {g.email && <p className="font-serif text-xs text-[#f5ead8]/40">{g.email}</p>}
                        {g.mobile && <p className="font-serif text-xs text-[#f5ead8]/40">{g.mobile}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {rsvp
                          ? badge(RSVP_BADGE[rsvp.response].label, RSVP_BADGE[rsvp.response].color)
                          : badge("No reply", "rgba(212,160,23,0.5)")}
                        {rsvp?.party_size && rsvp.party_size > 1 && (
                          <span className="font-serif text-[10px] text-gold/30">Party of {rsvp.party_size}</span>
                        )}
                      </div>
                    </div>

                    {/* Invite actions */}
                    <div className="flex gap-1.5 flex-wrap">
                      {g.email && (
                        <button onClick={() => emailInvite(g)}
                          className="px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
                          style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(245,234,216,0.6)" }}>
                          ✉ Email Invite
                        </button>
                      )}
                      {g.mobile && (
                        <button onClick={() => smsInvite(g)}
                          className="px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
                          style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: "rgba(245,234,216,0.6)" }}>
                          💬 SMS Invite
                        </button>
                      )}
                      <button onClick={() => copyInviteLink(g.invitation_token)}
                        className="px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
                        style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: copiedToken === g.invitation_token ? "#22c55e" : "rgba(245,234,216,0.6)" }}>
                        {copiedToken === g.invitation_token ? "✓ Copied" : "🔗 Copy Link"}
                      </button>
                      <button onClick={() => deleteGuest(g.id)}
                        className="ml-auto px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
                        style={{ color: "rgba(239,68,68,0.5)" }}>
                        Remove
                      </button>
                    </div>

                    {rsvp?.dietary_restrictions && (
                      <p className="font-serif text-xs text-[#f5ead8]/30">Dietary: {rsvp.dietary_restrictions}</p>
                    )}
                    {rsvp?.notes && (
                      <p className="font-serif text-xs text-[#f5ead8]/30 italic">"{rsvp.notes}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MEMORIES ─────────────────────────────────────────────────────── */}
      {tab === "memories" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {["all", "submitted", "approved", "rejected"].map((f) => (
              <button key={f} onClick={() => { setMemFilter(f); loadMemories(f); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg font-serif text-xs capitalize transition-all"
                style={memFilter === f
                  ? { background: "rgba(212,160,23,0.2)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.4)" }
                  : { background: "rgba(212,160,23,0.05)", color: "rgba(245,234,216,0.4)", border: "1px solid rgba(212,160,23,0.1)" }}>
                {f === "submitted" ? "Pending" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {memoriesLoading ? (
            <p className="font-serif text-sm text-gold/30 text-center py-8 animate-pulse">Loading…</p>
          ) : memories.length === 0 ? (
            <p className="font-serif text-sm text-gold/30 text-center py-12">No memories in this category yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {memories.map((m) => (
                <div key={m.id} className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif font-semibold text-[#f5ead8]">{m.storyteller_name}</p>
                      {m.relationship && <p className="font-serif text-xs text-gold/40">{m.relationship}</p>}
                      {m.title && <p className="font-serif text-sm text-[#f5ead8]/60 mt-1 italic">{m.title}</p>}
                    </div>
                    {m.status === "submitted"
                      ? badge("Pending Review", "#f59e0b")
                      : m.status === "approved"
                      ? badge("Approved", "#22c55e")
                      : badge("Rejected", "#ef4444")}
                  </div>

                  {m.story_text && (
                    <p className="font-serif text-sm text-[#f5ead8]/55 leading-relaxed line-clamp-3">{m.story_text}</p>
                  )}

                  {m.celebration_memory_media && m.celebration_memory_media.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {m.celebration_memory_media.map((med) => (
                        <div key={med.id}>
                          {med.media_type === "image" ? (
                            <img src={med.file_url} alt={med.caption ?? ""} className="w-16 h-16 object-cover rounded-lg" />
                          ) : med.media_type === "video" ? (
                            <div className="w-16 h-16 rounded-lg flex items-center justify-center"
                              style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)" }}>
                              <span className="text-2xl">🎬</span>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg flex items-center justify-center"
                              style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)" }}>
                              <span className="text-2xl">🎙</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => updateMemoryStatus(m.id, "approved")}
                      disabled={updatingMemory === m.id || m.status === "approved"}
                      className="flex-1 py-2 rounded-xl font-serif text-sm transition-all disabled:opacity-40"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => updateMemoryStatus(m.id, "rejected")}
                      disabled={updatingMemory === m.id || m.status === "rejected"}
                      className="flex-1 py-2 rounded-xl font-serif text-sm transition-all disabled:opacity-40"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CAROUSEL ─────────────────────────────────────────────────────── */}
      {tab === "carousel" && (
        <div className="flex flex-col gap-4">
          <p className="font-serif text-sm text-[#f5ead8]/50">
            Toggle photos on/off and reorder them. Only approved images show in the public carousel.
          </p>

          {carouselLoading ? (
            <p className="font-serif text-sm text-gold/30 text-center py-8 animate-pulse">Loading…</p>
          ) : carouselMedia.length === 0 ? (
            <p className="font-serif text-sm text-gold/30 text-center py-12">No images available yet. Guests need to share photos first.</p>
          ) : (
            <>
              {/* Approved / ordered */}
              {carouselMedia.filter((m) => m.carousel_approved).sort((a, b) => a.carousel_order - b.carousel_order).length > 0 && (
                <div className="warm-glass rounded-2xl p-4 flex flex-col gap-3">
                  <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40">Showing in Carousel</p>
                  {carouselMedia.filter((m) => m.carousel_approved).sort((a, b) => a.carousel_order - b.carousel_order).map((m, i, arr) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <img src={m.file_url} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-xs text-[#f5ead8]/60 truncate">{m.celebration_memories?.storyteller_name ?? "Unknown"}</p>
                        {m.caption && <p className="font-serif text-[10px] text-[#f5ead8]/30 truncate">{m.caption}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => moveCarousel(m.id, -1)} disabled={i === 0}
                          className="w-7 h-7 rounded flex items-center justify-center font-serif text-xs disabled:opacity-20"
                          style={{ background: "rgba(212,160,23,0.1)", color: "rgba(212,160,23,0.7)" }}>↑</button>
                        <button onClick={() => moveCarousel(m.id, 1)} disabled={i === arr.length - 1}
                          className="w-7 h-7 rounded flex items-center justify-center font-serif text-xs disabled:opacity-20"
                          style={{ background: "rgba(212,160,23,0.1)", color: "rgba(212,160,23,0.7)" }}>↓</button>
                        <button onClick={() => toggleCarousel(m.id)}
                          className="w-7 h-7 rounded flex items-center justify-center text-xs"
                          style={{ background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.6)" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Not approved */}
              {carouselMedia.filter((m) => !m.carousel_approved).length > 0 && (
                <div className="warm-glass rounded-2xl p-4 flex flex-col gap-3">
                  <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40">Not in Carousel</p>
                  <div className="grid grid-cols-3 gap-2">
                    {carouselMedia.filter((m) => !m.carousel_approved).map((m) => (
                      <button key={m.id} onClick={() => toggleCarousel(m.id)}
                        className="relative aspect-square rounded-lg overflow-hidden group">
                        <img src={m.file_url} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl text-white/60 group-hover:text-white/90">+</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={saveCarousel} disabled={savingCarousel}
                className="w-full py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)" }}>
                {savingCarousel ? "Saving…" : carouselSaved ? "✓ Saved" : "Save Carousel Order"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── ADMINS ───────────────────────────────────────────────────────── */}
      {tab === "admins" && admin.is_super && (
        <div className="flex flex-col gap-4">
          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
            <p className="font-serif text-[10px] uppercase tracking-widest text-gold/40">Add Admin</p>
            <input type="email" placeholder="Their email address *" value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)} className={inputCls} style={inputStyle} />
            <input type="text" placeholder="Their name (optional)" value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)} className={inputCls} style={inputStyle} />
            <button onClick={addAdmin} disabled={addingAdmin || !newAdminEmail.trim()}
              className="py-2.5 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#d4a017,#c8843a)" }}>
              {addingAdmin ? "Creating…" : "Create Admin Link →"}
            </button>
            <p className="font-serif text-[10px] text-[#f5ead8]/30">
              A unique admin link is generated. Copy it and send to them — they click it to access the dashboard.
            </p>
          </div>

          {adminsLoading ? (
            <p className="font-serif text-sm text-gold/30 text-center py-8 animate-pulse">Loading…</p>
          ) : (
            <div className="flex flex-col gap-3">
              {admins.map((a) => (
                <div key={a.id} className="warm-glass rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif font-semibold text-[#f5ead8]">
                        {a.name ?? a.email}
                        {a.is_super && <span className="ml-2 font-serif text-[10px] text-gold/50">Super Admin</span>}
                      </p>
                      {a.name && <p className="font-serif text-xs text-[#f5ead8]/40">{a.email}</p>}
                      <p className="font-serif text-[10px] text-[#f5ead8]/25 mt-0.5">
                        {a.last_accessed_at
                          ? `Last access: ${new Date(a.last_accessed_at).toLocaleDateString()}`
                          : "Never accessed"}
                      </p>
                    </div>
                    {badge(a.is_active ? "Active" : "Inactive", a.is_active ? "#22c55e" : "#6b7280")}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => copyAdminLink(a.admin_token)}
                      className="flex-1 py-1.5 rounded-lg font-serif text-xs transition-colors"
                      style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)", color: copiedAdminToken === a.admin_token ? "#22c55e" : "rgba(245,234,216,0.6)" }}>
                      {copiedAdminToken === a.admin_token ? "✓ Copied" : "🔗 Copy Admin Link"}
                    </button>
                    {!a.is_super && (
                      <button onClick={() => toggleAdmin(a.id)}
                        className="px-4 py-1.5 rounded-lg font-serif text-xs transition-colors"
                        style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.12)", color: a.is_active ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.6)" }}>
                        {a.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
