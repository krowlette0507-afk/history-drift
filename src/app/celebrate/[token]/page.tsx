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
    weekday: "long", year: "numeric", month: "long", day: "numeric",
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
      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-[#1c1208]">
        {images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: i === slide ? 1 : 0 }}
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
    </div>
  );
}
