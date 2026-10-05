"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CelebrationEvent {
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
  parking_information?: string;
  dress_information?: string;
  rsvp_deadline?: string;
  host_contact?: string;
  hero_images?: string[];
}

interface Guest {
  id: string;
  first_name: string;
  last_name?: string;
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric",
  });
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gold/10 last:border-0">
      <span className="text-gold/50 text-sm mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-0.5">{label}</p>
        <p className="font-serif text-[#f5ead8] text-sm leading-snug">{value}</p>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "What can I share?",
    a: "Photos of yourself with Cecil, old photos of Cecil from your collection, short videos up to 1 minute, a written story or memory, or even an audio recording in your own voice. All of it is welcome.",
  },
  {
    q: "Can I still participate if I can't attend?",
    a: "Absolutely. Select 'No' or 'Maybe' when you RSVP and still share a photo, story, or heartfelt message. Cecil and the family will see every wish — your presence in spirit means just as much.",
  },
  {
    q: "Is my content private and secure?",
    a: "Yes. Everything you share — photos, stories, messages — is stored securely and visible only to the Rowlette family. Nothing is made public or shared outside this celebration.",
  },
  {
    q: "How long can a video be?",
    a: "Up to 1 minute. A short, sincere clip — telling a favourite memory or simply saying happy birthday — is perfect.",
  },
  {
    q: "Do I need an account or app?",
    a: "No account, no download. Your personal link is all you need to RSVP, share memories, and view the gallery.",
  },
  {
    q: "Can I forward this invitation to other family members?",
    a: "Yes! Use the Share with Family buttons below to send the link by email, SMS, or copy it to paste anywhere. Anyone with the link can view the page and contribute.",
  },
  {
    q: "Can I change my RSVP after I submit it?",
    a: "Yes. Come back to your invitation link anytime and tap 'Update My RSVP.' Your response will be updated immediately.",
  },
  {
    q: "Can I edit or delete something I shared?",
    a: "Please reach out to the host directly using the contact information on your invitation and they will take care of it.",
  },
  {
    q: "Will these memories be kept after the celebration?",
    a: "Yes. Every photo, story, and message is preserved permanently so the family can revisit them for years to come — that is the heart of what HistoryDrift is all about.",
  },
  {
    q: "Who can see my RSVP response?",
    a: "Only the host can see your RSVP. Your response is never shown publicly or shared with other guests.",
  },
  {
    q: "Can I share on behalf of someone who can't use a smartphone?",
    a: "Absolutely. You can upload their photos, type their story, or record a message on their behalf — just enter their name when prompted.",
  },
];

function FaqSection() {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="warm-glass rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => { setSectionOpen((v) => !v); setOpen(null); }}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Frequently Asked Questions</p>
        <span
          className="text-gold/50 text-lg leading-none flex-shrink-0 transition-transform duration-200"
          style={{ transform: sectionOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      {sectionOpen && (
        <div className="flex flex-col divide-y px-5 pb-3" style={{ borderColor: "rgba(212,160,23,0.08)" }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-3">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-3 text-left"
              >
                <span className="font-serif text-sm text-[#f5ead8]/90 leading-snug">{item.q}</span>
                <span
                  className="text-gold/50 text-lg leading-none flex-shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
                >
                  +
                </span>
              </button>
              {open === i && (
                <p className="font-serif text-xs text-[#f5ead8]/55 leading-relaxed mt-2 pr-6">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CarouselItem {
  id: string;
  file_url: string;
  caption: string;
  carousel_order: number;
}

function CarouselSection({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  useEffect(() => {
    fetch("/api/celebrate/carousel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId }),
    })
      .then((r) => r.json())
      .then((d) => setItems(d.media ?? []));
  }, [eventId]);

  const openLightbox = (idx: number) => { setLbIndex(idx); setLightbox(true); };
  const closeLightbox = () => setLightbox(false);
  const prev = () => setLbIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setLbIndex((i) => (i + 1) % items.length);

  // Auto-advance in lightbox
  useEffect(() => {
    if (!lightbox || items.length <= 1) return;
    const t = setInterval(() => setLbIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [lightbox, items.length]);

  // Auto-advance compact strip
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setCurrent((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="warm-glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Photo Gallery</p>
          <button
            type="button"
            onClick={() => openLightbox(current)}
            className="text-[10px] font-serif text-gold/50 hover:text-gold transition-colors"
          >
            ⤢ Expand
          </button>
        </div>
        <div className="relative" style={{ height: "220px" }}>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openLightbox(i)}
              className="absolute inset-0 w-full h-full"
              style={{ opacity: i === current ? 1 : 0, transition: "opacity 0.6s", cursor: "pointer" }}
            >
              <img
                src={item.file_url}
                alt={item.caption || ""}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </button>
          ))}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i - 1 + items.length) % items.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/40"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(245,234,216,0.8)" }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i + 1) % items.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/40"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(245,234,216,0.8)" }}
              >
                ›
              </button>
            </>
          )}
        </div>
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? "16px" : "6px",
                  height: "6px",
                  background: i === current ? "#d4a017" : "rgba(212,160,23,0.25)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 flex flex-col"
          style={{ background: "rgba(0,0,0,0.97)", zIndex: 50 }}
        >
          {/* Close button */}
          <div className="flex justify-end p-4 flex-shrink-0">
            <button
              type="button"
              onClick={closeLightbox}
              className="w-12 h-12 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.8)", fontSize: "28px", lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 relative flex items-center justify-center px-14 pb-4 min-h-0">
            <img
              src={items[lbIndex]?.file_url}
              alt={items[lbIndex]?.caption || ""}
              className="max-w-full max-h-full rounded-xl"
              style={{ objectFit: "contain" }}
            />
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "22px" }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "22px" }}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Caption + dots */}
          <div className="flex-shrink-0 pb-6 px-4 flex flex-col items-center gap-3">
            {items[lbIndex]?.caption && (
              <p className="font-serif text-xs text-white/50 text-center">{items[lbIndex].caption}</p>
            )}
            {items.length > 1 && (
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLbIndex(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === lbIndex ? "20px" : "6px",
                      height: "6px",
                      background: i === lbIndex ? "#d4a017" : "rgba(212,160,23,0.3)",
                    }}
                  />
                ))}
              </div>
            )}
            <p className="font-serif text-[10px] text-white/25">{lbIndex + 1} / {items.length}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [hasRsvp, setHasRsvp] = useState(false);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);

  useEffect(() => {
    fetch("/api/celebrate/invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        setEvent(d.event ?? null);
        setGuest(d.guest ?? null);
        setHasRsvp(!!d.rsvp);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const images = event?.hero_images?.filter(Boolean) ?? [];

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % Math.max(images.length, 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(nextSlide, 4000);
    return () => clearInterval(t);
  }, [images.length, nextSlide]);

  const shareUrl = `${origin}/celebrate/${token}`;

  const shareEmail = () => {
    const subject = encodeURIComponent(`You're invited: ${event?.title ?? "Celebration"}`);
    const body = encodeURIComponent(`${event?.welcome_message ?? "Join us!"}\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareSms = () => {
    window.open(`sms:?body=${encodeURIComponent(`${event?.title ?? "Celebration"} — ${shareUrl}`)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gold/40 font-serif text-sm animate-pulse">Loading invitation…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gold/50 font-serif text-lg">This invitation could not be found.</p>
        <p className="text-gold/30 font-serif text-sm mt-2">Please check your link and try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero carousel */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1c1208]" style={{ height: "260px" }}>
        {images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: i === slide ? 1 : 0, objectPosition: "center 20%" }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d1a08] to-[#0f0a04]" />
        )}

        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text leading-tight">
            {event.title}
          </h1>
          {guest ? (
            <p className="font-serif text-sm text-gold/80 mt-1">
              In honor of {event.honoree_name} — Welcome, {guest.first_name}
            </p>
          ) : (
            <p className="font-serif text-sm text-gold/80 mt-1">In honor of {event.honoree_name}</p>
          )}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{ background: i === slide ? "#d4a017" : "rgba(212,160,23,0.3)" }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Welcome message */}
      {event.welcome_message && (
        <p className="font-serif text-center text-[#f5ead8]/80 text-sm leading-relaxed px-2">
          {event.welcome_message}
        </p>
      )}

      {/* Event details */}
      <div className="warm-glass rounded-2xl p-5">
        {event.date && <DetailRow icon="📅" label="Date" value={formatDate(event.date)} />}
        {(event.start_time || event.end_time) && (
          <DetailRow
            icon="🕕"
            label="Time"
            value={[event.start_time, event.end_time].filter(Boolean).join(" – ")}
          />
        )}
        {event.venue && <DetailRow icon="📍" label="Venue" value={event.venue} />}
        {event.address && <DetailRow icon="🗺" label="Address" value={event.address} />}
        {event.parking_information && <DetailRow icon="🅿" label="Parking" value={event.parking_information} />}
        {event.dress_information && <DetailRow icon="👔" label="Dress" value={event.dress_information} />}
        {event.rsvp_deadline && <DetailRow icon="📬" label="RSVP By" value={formatDate(event.rsvp_deadline)} />}
        {event.host_contact && <DetailRow icon="📞" label="Host Contact" value={event.host_contact} />}
      </div>

      {/* Calendar / maps */}
      {event.address && (
        <div className="flex gap-4 text-sm font-serif justify-center">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold/60 hover:text-gold underline underline-offset-2 transition-colors"
          >
            Open in maps
          </a>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3">
        <Link
          href={`/celebrate/${token}/rsvp`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
        >
          📋 {hasRsvp ? "Update My RSVP" : "RSVP Now"} →
        </Link>
        <Link
          href={`/celebrate/${token}/share-memory`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-serif text-[#f5ead8] warm-glass hover:border-gold/40 transition-colors"
          style={{ border: "1px solid rgba(212,160,23,0.25)" }}
        >
          📸 Share a Memory
        </Link>
        <Link
          href={`/celebrate/${token}/gallery`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-serif text-[#f5ead8] warm-glass hover:border-gold/40 transition-colors"
          style={{ border: "1px solid rgba(212,160,23,0.25)" }}
        >
          🎁 View Photo Gallery
        </Link>
      </div>

      {/* Share with family */}
      <div className="warm-glass rounded-2xl p-5">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40 mb-3">Share with Family</p>
        <div className="flex gap-2">
          <button
            onClick={shareEmail}
            className="flex-1 py-2.5 rounded-lg font-serif text-sm text-[#f5ead8]/70 hover:text-[#f5ead8] transition-colors"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)" }}
          >
            ✉ Email
          </button>
          <button
            onClick={shareSms}
            className="flex-1 py-2.5 rounded-lg font-serif text-sm text-[#f5ead8]/70 hover:text-[#f5ead8] transition-colors"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)" }}
          >
            💬 SMS
          </button>
          <button
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
            className="flex-1 py-2.5 rounded-lg font-serif text-sm text-[#f5ead8]/70 hover:text-[#f5ead8] transition-colors"
            style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.15)" }}
          >
            🔗 Copy link
          </button>
        </div>
      </div>

      {/* Photo Carousel */}
      <CarouselSection eventId={event.id} />

      {/* FAQ */}
      <FaqSection />
    </div>
  );
}
