"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface WishEvent {
  id: string;
  honoree_name: string;
  title: string;
  hero_images?: string[];
}

interface CarouselItem {
  id: string;
  file_url: string;
  caption: string;
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

  const next = useCallback(() => setLbIndex((i) => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    if (!lightbox || items.length <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [lightbox, items.length, next]);

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
          <button type="button" onClick={() => { setLbIndex(current); setLightbox(true); }}
            className="text-[10px] font-serif text-gold/50 hover:text-gold transition-colors">⤢ Expand</button>
        </div>
        <div className="relative" style={{ height: "200px" }}>
          {items.map((item, i) => (
            <button key={item.id} type="button" onClick={() => { setLbIndex(i); setLightbox(true); }}
              className="absolute inset-0 w-full h-full"
              style={{ opacity: i === current ? 1 : 0, transition: "opacity 0.6s" }}>
              <img src={item.file_url} alt={item.caption || ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </button>
          ))}
          {items.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i - 1 + items.length) % items.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(245,234,216,0.8)" }}>‹</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setCurrent((i) => (i + 1) % items.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(245,234,216,0.8)" }}>›</button>
            </>
          )}
        </div>
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {items.map((_, i) => (
              <button key={i} type="button" onClick={() => setCurrent(i)} className="rounded-full transition-all"
                style={{ width: i === current ? "16px" : "6px", height: "6px",
                  background: i === current ? "#d4a017" : "rgba(212,160,23,0.25)" }} />
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <div className="fixed inset-0 flex flex-col" style={{ background: "rgba(0,0,0,0.97)", zIndex: 50 }}>
          <div className="flex justify-end p-4 flex-shrink-0">
            <button type="button" onClick={() => setLightbox(false)}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              style={{ color: "rgba(255,255,255,0.8)", fontSize: "28px" }}>✕</button>
          </div>
          <div className="flex-1 relative flex items-center justify-center px-14 pb-4 min-h-0">
            <img src={items[lbIndex]?.file_url} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
            {items.length > 1 && (
              <>
                <button type="button" onClick={() => setLbIndex((i) => (i - 1 + items.length) % items.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "22px" }}>‹</button>
                <button type="button" onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: "22px" }}>›</button>
              </>
            )}
          </div>
          <div className="flex-shrink-0 pb-6 px-4 flex flex-col items-center gap-3">
            {items[lbIndex]?.caption && (
              <p className="font-serif text-xs text-white/50 text-center">{items[lbIndex].caption}</p>
            )}
            {items.length > 1 && (
              <div className="flex gap-1.5">
                {items.map((_, i) => (
                  <button key={i} type="button" onClick={() => setLbIndex(i)} className="rounded-full transition-all"
                    style={{ width: i === lbIndex ? "20px" : "6px", height: "6px",
                      background: i === lbIndex ? "#d4a017" : "rgba(212,160,23,0.3)" }} />
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

export default function WishesPage() {
  const { wishes_token } = useParams<{ wishes_token: string }>();

  const [event, setEvent] = useState<WishEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/wishes/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishes_token }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.event) setEvent(d.event); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [wishes_token]);

  const images = event?.hero_images?.filter(Boolean) ?? [];
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="font-serif text-sm text-gold/40 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="text-center py-20">
        <p className="font-serif text-lg text-gold/50">This link could not be found.</p>
        <p className="font-serif text-sm text-gold/30 mt-2">Please check the link and try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden flex flex-col items-center"
        style={{ background: "linear-gradient(160deg,#1c1208 0%,#0f0a04 100%)", minHeight: "300px" }}>
        {images.length > 0 ? (
          <div className="relative w-full flex-1" style={{ minHeight: "260px" }}>
            {images.map((src, i) => (
              <img key={i} src={src} alt={event.honoree_name}
                className="absolute inset-0 w-full h-full transition-opacity duration-700"
                style={{ opacity: i === slide ? 1 : 0, objectFit: "contain", objectPosition: "center top" }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-10">
            <span className="text-6xl opacity-20">🎂</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="font-serif text-xs text-gold/60 uppercase tracking-widest mb-1">Birthday Wishes</p>
          <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text leading-tight">
            {event.honoree_name}
          </h1>
          <p className="font-serif text-xs text-gold/50 mt-1">Born November 25</p>
        </div>
      </div>

      {/* Intro */}
      <p className="font-serif text-center text-[#f5ead8]/70 text-sm leading-relaxed px-2">
        Share your love for <strong className="text-gold/80 font-normal">{event.honoree_name}</strong> — a message, a photo, or a quick video. Forward this link to anyone who knows them.
      </p>

      {/* Contribution options */}
      <div className="flex flex-col gap-4">
        <Link
          href={`/wishes/${wishes_token}/tell`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}>✍</div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Write a Message
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Type a birthday wish or share a favourite memory in your own words.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>

        <Link
          href={`/wishes/${wishes_token}/photo`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}>📷</div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Send a Photo
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Upload a photo of you together or a favourite picture. Add a caption if you like.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>

        <Link
          href={`/wishes/${wishes_token}/video`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}>🎬</div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Record a Video Message
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Record up to 30 seconds right from your camera — say happy birthday in your own voice.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>
      </div>

      {/* Share link */}
      <div className="warm-glass rounded-2xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[10px] text-gold/40 uppercase tracking-widest mb-0.5">Share this page</p>
          <p className="font-serif text-xs text-[#f5ead8]/30 truncate">Forward to family &amp; friends</p>
        </div>
        <button type="button" onClick={copyLink}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
          style={{ background: "rgba(212,160,23,0.1)", color: copied ? "#22c55e" : "rgba(212,160,23,0.6)" }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
      </div>

      {/* Photo carousel */}
      <CarouselSection eventId={event.id} />
    </div>
  );
}
