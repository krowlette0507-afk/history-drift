"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ADMIN_USER_ID = "0ee40321-7a90-4c7d-ba9d-cfa1b97d4f11";

interface CelebrationEvent {
  id: string;
  title: string;
  honoree_name: string;
  date: string;
  venue: string;
  is_active: boolean;
  created_at: string;
}

interface RsvpSummary {
  yes: number;
  no: number;
  maybe: number;
  total_guests: number;
}

interface RecentMemory {
  id: string;
  storyteller_name: string;
  title: string;
  status: string;
  created_at: string;
  has_photo: boolean;
}

interface Guest {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  mobile: string | null;
  invitation_token: string;
  invitation_sent: boolean;
  created_at: string;
  celebration_rsvps: { response: string; party_size: number; submitted_at: string }[];
}

interface CarouselMedia {
  id: string;
  file_url: string;
  media_type: string;
  caption: string;
  carousel_approved: boolean;
  carousel_order: number;
  original_filename: string;
  celebration_memories: { storyteller_name: string; title: string } | null;
}

async function adminFetch(path: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export default function CelebrateAdminPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CelebrationEvent | null>(null);
  const [rsvpSummary, setRsvpSummary] = useState<RsvpSummary | null>(null);
  const [memories, setMemories] = useState<RecentMemory[]>([]);
  const [tab, setTab] = useState<"overview" | "guests" | "memories" | "carousel" | "create">("overview");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Guest tab state
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [guestForm, setGuestForm] = useState({ first_name: "", last_name: "", email: "", mobile: "" });
  const [lastAdded, setLastAdded] = useState<Guest | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Carousel tab state
  const [carouselMedia, setCarouselMedia] = useState<CarouselMedia[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselSaving, setCarouselSaving] = useState(false);
  const [carouselSaved, setCarouselSaved] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    honoree_name: "",
    title: "",
    description: "",
    welcome_message: "",
    date: "",
    start_time: "",
    end_time: "",
    venue: "",
    address: "",
    parking_information: "",
    dress_information: "",
    rsvp_deadline: "",
    host_contact: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await adminFetch("/api/celebrate/admin/events");
    const d = await res.json();
    setEvents(d.events ?? []);
    if (d.events?.length) setSelectedEvent(d.events[0]);
  }, []);

  useEffect(() => {
    if (userId === ADMIN_USER_ID) loadEvents();
  }, [userId, loadEvents]);

  useEffect(() => {
    if (!selectedEvent) return;
    adminFetch("/api/celebrate/admin/stats", { event_id: selectedEvent.id })
      .then((r) => r.json())
      .then((d) => {
        setRsvpSummary(d.rsvp_summary ?? null);
        setMemories(d.recent_memories ?? []);
      });
  }, [selectedEvent]);

  const loadGuests = useCallback(async () => {
    if (!selectedEvent) return;
    setGuestsLoading(true);
    const res = await adminFetch("/api/celebrate/admin/guests", { event_id: selectedEvent.id });
    const d = await res.json();
    setGuests(d.guests ?? []);
    setGuestsLoading(false);
  }, [selectedEvent]);

  useEffect(() => {
    if (tab === "guests" && selectedEvent) loadGuests();
  }, [tab, selectedEvent, loadGuests]);

  const loadCarouselMedia = useCallback(async () => {
    if (!selectedEvent) return;
    setCarouselLoading(true);
    const res = await adminFetch("/api/celebrate/admin/carousel", { action: "get", event_id: selectedEvent.id });
    const d = await res.json();
    setCarouselMedia(d.media ?? []);
    setCarouselLoading(false);
  }, [selectedEvent]);

  useEffect(() => {
    if (tab === "carousel" && selectedEvent) loadCarouselMedia();
  }, [tab, selectedEvent, loadCarouselMedia]);

  const toggleCarouselApproved = (id: string) => {
    setCarouselMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (!item) return prev;
      const wasApproved = item.carousel_approved;
      const approvedItems = prev.filter((m) => m.carousel_approved && m.id !== id);
      const newOrder = wasApproved ? 999 : approvedItems.length + 1;
      return prev.map((m) =>
        m.id === id ? { ...m, carousel_approved: !wasApproved, carousel_order: newOrder } : m
      );
    });
  };

  const moveCarouselItem = (id: string, dir: -1 | 1) => {
    setCarouselMedia((prev) => {
      const approved = prev.filter((m) => m.carousel_approved).sort((a, b) => a.carousel_order - b.carousel_order);
      const idx = approved.findIndex((m) => m.id === id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= approved.length) return prev;
      const updated = [...approved];
      [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
      updated.forEach((m, i) => { m.carousel_order = i + 1; });
      const approvedIds = new Set(approved.map((m) => m.id));
      return prev.map((m) => {
        const upd = updated.find((u) => u.id === m.id);
        if (upd) return { ...m, carousel_order: upd.carousel_order };
        if (!approvedIds.has(m.id)) return m;
        return m;
      });
    });
  };

  const saveCarousel = async () => {
    if (!selectedEvent) return;
    setCarouselSaving(true);
    const items = carouselMedia.map((m) => ({ id: m.id, carousel_approved: m.carousel_approved, carousel_order: m.carousel_order }));
    await adminFetch("/api/celebrate/admin/carousel", { action: "save", event_id: selectedEvent.id, items });
    setCarouselSaving(false);
    setCarouselSaved(true);
    setTimeout(() => setCarouselSaved(false), 2000);
  };

  const addGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setAddingGuest(true);
    const res = await adminFetch("/api/celebrate/admin/add-guest", {
      event_id: selectedEvent.id,
      ...guestForm,
    });
    const d = await res.json();
    if (res.ok) {
      setGuests((g) => [...g, d.guest]);
      setLastAdded(d.guest);
      setGuestForm({ first_name: "", last_name: "", email: "", mobile: "" });
    }
    setAddingGuest(false);
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/celebrate/${token}`;
    navigator.clipboard?.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await adminFetch("/api/celebrate/admin/create-event", form);
    const d = await res.json();
    if (!res.ok) { setCreateError(d.error ?? "Error"); setCreating(false); return; }
    await loadEvents();
    setTab("overview");
    setCreating(false);
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
        <div className="text-amber-700/50 font-serif text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (userId !== ADMIN_USER_ID) {
    return (
      <div className="text-center py-20">
        <p className="text-amber-700/50 font-serif text-lg mb-2">Access denied.</p>
        <Link href="/dashboard" className="text-sm font-serif text-amber-600 hover:text-amber-400 underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold text-amber-200">Celebrate Admin</h1>
        <Link href="/dashboard" className="text-xs font-serif text-amber-700/50 hover:text-amber-500 transition-colors">
          ← Dashboard
        </Link>
      </div>

      {/* Event selector */}
      {events.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className="flex-shrink-0 px-3 py-2 rounded-xl font-serif text-sm transition-all"
              style={
                selectedEvent?.id === ev.id
                  ? { background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)", color: "#0f0a04" }
                  : { background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)", color: "rgba(245,234,216,0.6)" }
              }
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid rgba(212,160,23,0.1)" }}>
        {(["overview", "guests", "memories", "carousel", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-shrink-0 px-4 py-2.5 font-serif text-xs capitalize transition-colors"
            style={
              tab === t
                ? { color: "#d4a017", borderBottom: "2px solid #d4a017" }
                : { color: "rgba(245,234,216,0.4)" }
            }
          >
            {t === "create" ? "+ New Event" : t === "guests" ? `Guests${guests.length ? ` (${guests.length})` : ""}` : t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && selectedEvent && (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(212,160,23,0.15)" }}
          >
            <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/50 mb-3">Event Details</p>
            <h2 className="font-serif text-lg font-bold text-amber-200 mb-1">{selectedEvent.title}</h2>
            <p className="font-serif text-sm text-amber-200/60">{selectedEvent.honoree_name}</p>
            <p className="font-serif text-sm text-amber-200/40 mt-1">
              {selectedEvent.date} · {selectedEvent.venue}
            </p>
          </div>

          {rsvpSummary && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Yes", value: rsvpSummary.yes, color: "#22c55e" },
                { label: "Maybe", value: rsvpSummary.maybe, color: "#eab308" },
                { label: "No", value: rsvpSummary.no, color: "#ef4444" },
                { label: "Guests", value: rsvpSummary.total_guests, color: "#d4a017" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(18,11,4,0.7)", border: `1px solid ${color}25` }}
                >
                  <div className="font-serif text-2xl font-bold" style={{ color }}>{value}</div>
                  <div className="font-serif text-[10px] text-amber-700/50 mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/50 mb-2">Guest Link</p>
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.15)" }}
            >
              <code className="font-mono text-xs text-amber-300/70 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                /celebrate/[guest-invitation-token]
              </code>
            </div>
            <p className="font-serif text-xs text-amber-700/40 mt-1">
              Each guest receives a unique link. Manage guests via Supabase.
            </p>
          </div>
        </div>
      )}

      {/* Guests tab */}
      {tab === "guests" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-serif text-xs text-amber-700/50">
              {guests.length} guest{guests.length !== 1 ? "s" : ""} added
            </p>
            <button
              onClick={() => { setShowAddForm((v) => !v); setLastAdded(null); }}
              className="px-3 py-1.5 rounded-lg font-serif text-xs font-semibold text-[#0f0a04] transition-opacity hover:opacity-80"
              style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
            >
              {showAddForm ? "Cancel" : "+ Add Guest"}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={addGuest}
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(212,160,23,0.2)" }}
            >
              <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/50">New Guest</p>
              {lastAdded && (
                <div
                  className="rounded-lg px-3 py-2 flex items-center gap-2"
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                >
                  <span className="text-green-400 text-xs">✓</span>
                  <span className="font-serif text-xs text-green-400">
                    {lastAdded.first_name} {lastAdded.last_name ?? ""} added — link ready to copy below
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "first_name", placeholder: "First name *", required: true },
                  { key: "last_name", placeholder: "Last name" },
                  { key: "email", placeholder: "Email" },
                  { key: "mobile", placeholder: "Mobile" },
                ].map(({ key, placeholder, required }) => (
                  <input
                    key={key}
                    type="text"
                    placeholder={placeholder}
                    required={required}
                    value={guestForm[key as keyof typeof guestForm]}
                    onChange={(e) => setGuestForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={addingGuest}
                className="w-full py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
              >
                {addingGuest ? "Adding…" : "Add & Generate Link →"}
              </button>
            </form>
          )}

          {guestsLoading ? (
            <p className="font-serif text-sm text-amber-700/40 text-center py-6 animate-pulse">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="font-serif text-sm text-amber-700/40 text-center py-8">No guests added yet.</p>
          ) : (
            guests.map((g) => {
              const rsvp = g.celebration_rsvps?.[0];
              const rsvpColor = rsvp?.response === "yes" ? "#22c55e" : rsvp?.response === "no" ? "#ef4444" : rsvp?.response === "maybe" ? "#eab308" : "rgba(212,160,23,0.3)";
              const rsvpLabel = rsvp?.response ?? "pending";
              return (
                <div
                  key={g.id}
                  className="rounded-xl p-3.5 flex items-center gap-3"
                  style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(212,160,23,0.1)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-amber-200 truncate">
                      {g.first_name} {g.last_name ?? ""}
                    </p>
                    <p className="font-mono text-[10px] text-amber-700/40 truncate mt-0.5">
                      /celebrate/{g.invitation_token}
                    </p>
                    {(g.email || g.mobile) && (
                      <p className="font-serif text-[10px] text-amber-700/40 truncate">
                        {[g.email, g.mobile].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-serif capitalize"
                      style={{ background: `${rsvpColor}20`, color: rsvpColor }}
                    >
                      {rsvpLabel}
                    </span>
                    <button
                      onClick={() => copyLink(g.invitation_token)}
                      className="px-2.5 py-1 rounded-lg font-serif text-[10px] transition-colors"
                      style={{ background: "rgba(212,160,23,0.1)", color: copiedToken === g.invitation_token ? "#22c55e" : "rgba(212,160,23,0.6)" }}
                    >
                      {copiedToken === g.invitation_token ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Memories tab */}
      {tab === "memories" && (
        <div className="flex flex-col gap-3">
          {memories.length === 0 ? (
            <p className="font-serif text-sm text-amber-700/40 text-center py-8">No memories shared yet.</p>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(212,160,23,0.1)" }}
              >
                <span className="text-xl flex-shrink-0">{m.has_photo ? "📷" : "✍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm text-amber-200 truncate">{m.title}</p>
                  <p className="font-serif text-xs text-amber-700/50 mt-0.5">
                    {m.storyteller_name} · {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-serif flex-shrink-0"
                  style={{
                    background: m.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(212,160,23,0.12)",
                    color: m.status === "approved" ? "#22c55e" : "#d4a017",
                  }}
                >
                  {m.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Carousel tab */}
      {tab === "carousel" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-serif text-xs text-amber-700/50">
              {carouselMedia.filter((m) => m.carousel_approved).length} of {carouselMedia.length} photo{carouselMedia.length !== 1 ? "s" : ""} in carousel
            </p>
            <button
              onClick={saveCarousel}
              disabled={carouselSaving}
              className="px-3 py-1.5 rounded-lg font-serif text-xs font-semibold text-[#0f0a04] transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: carouselSaved ? "rgba(34,197,94,0.8)" : "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
            >
              {carouselSaving ? "Saving…" : carouselSaved ? "✓ Saved" : "Save Carousel"}
            </button>
          </div>

          {carouselLoading ? (
            <p className="font-serif text-sm text-amber-700/40 text-center py-8 animate-pulse">Loading photos…</p>
          ) : carouselMedia.length === 0 ? (
            <p className="font-serif text-sm text-amber-700/40 text-center py-8">No photos shared yet.</p>
          ) : (
            <>
              {/* Approved items in order */}
              {carouselMedia.filter((m) => m.carousel_approved).sort((a, b) => a.carousel_order - b.carousel_order).length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">In Carousel</p>
                  {carouselMedia
                    .filter((m) => m.carousel_approved)
                    .sort((a, b) => a.carousel_order - b.carousel_order)
                    .map((m, idx, arr) => (
                      <div
                        key={m.id}
                        className="rounded-xl p-3 flex items-center gap-3"
                        style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.2)" }}
                      >
                        <img
                          src={m.file_url}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-amber-200 truncate">
                            {m.celebration_memories?.storyteller_name ?? "Unknown"}
                          </p>
                          <p className="font-serif text-[10px] text-amber-700/40 truncate">
                            {m.celebration_memories?.title ?? ""}
                          </p>
                          <p className="font-serif text-[10px] text-gold/50 mt-0.5">Position {idx + 1}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => moveCarouselItem(m.id, -1)}
                            disabled={idx === 0}
                            className="w-7 h-7 rounded-md text-xs flex items-center justify-center disabled:opacity-20 transition-colors hover:bg-gold/10"
                            style={{ border: "1px solid rgba(212,160,23,0.25)", color: "#d4a017" }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveCarouselItem(m.id, 1)}
                            disabled={idx === arr.length - 1}
                            className="w-7 h-7 rounded-md text-xs flex items-center justify-center disabled:opacity-20 transition-colors hover:bg-gold/10"
                            style={{ border: "1px solid rgba(212,160,23,0.25)", color: "#d4a017" }}
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCarouselApproved(m.id)}
                          className="flex-shrink-0 px-2.5 py-1 rounded-lg font-serif text-[10px] transition-all"
                          style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
                        >
                          ✓ In
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Un-approved items */}
              {carouselMedia.filter((m) => !m.carousel_approved).length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/30 mt-2">Not in Carousel</p>
                  {carouselMedia.filter((m) => !m.carousel_approved).map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl p-3 flex items-center gap-3"
                      style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(212,160,23,0.08)" }}
                    >
                      <img
                        src={m.file_url}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 opacity-60"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm text-amber-200/60 truncate">
                          {m.celebration_memories?.storyteller_name ?? "Unknown"}
                        </p>
                        <p className="font-serif text-[10px] text-amber-700/30 truncate">
                          {m.celebration_memories?.title ?? ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCarouselApproved(m.id)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg font-serif text-[10px] transition-all hover:border-gold/30"
                        style={{ background: "rgba(212,160,23,0.06)", color: "rgba(212,160,23,0.4)", border: "1px solid rgba(212,160,23,0.12)" }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Create event tab */}
      {tab === "create" && (
        <form onSubmit={createEvent} className="flex flex-col gap-4">
          <p className="font-serif text-xs text-amber-700/50">
            Creates a new celebration event. Guests are added via Supabase with unique invitation tokens.
          </p>

          {[
            { key: "honoree_name", label: "Honoree Name *", placeholder: "e.g. Margaret Johnson", required: true },
            { key: "title", label: "Event Title *", placeholder: "e.g. Margaret's 80th Birthday", required: true },
            { key: "date", label: "Date *", placeholder: "YYYY-MM-DD", required: true },
            { key: "venue", label: "Venue *", placeholder: "e.g. The Grand Ballroom", required: true },
            { key: "address", label: "Address", placeholder: "123 Main St, City, State" },
            { key: "start_time", label: "Start Time", placeholder: "e.g. 6:00 PM" },
            { key: "end_time", label: "End Time", placeholder: "e.g. 10:00 PM" },
            { key: "rsvp_deadline", label: "RSVP Deadline", placeholder: "YYYY-MM-DD" },
            { key: "dress_information", label: "Dress Code", placeholder: "e.g. Black Tie Optional" },
            { key: "parking_information", label: "Parking Info", placeholder: "" },
            { key: "host_contact", label: "Host Contact", placeholder: "e.g. Jane Smith · 555-0100" },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/50 mb-1">{label}</p>
              <input
                type="text"
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                required={required}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          ))}

          {["description", "welcome_message"].map((key) => (
            <div key={key}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-amber-700/50 mb-1 capitalize">
                {key.replace("_", " ")}
              </p>
              <textarea
                rows={3}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={inputClass + " resize-none"}
                style={inputStyle}
              />
            </div>
          ))}

          {createError && <p className="text-red-400 font-serif text-sm">{createError}</p>}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
          >
            {creating ? "Creating…" : "Create Event →"}
          </button>
        </form>
      )}
    </div>
  );
}
