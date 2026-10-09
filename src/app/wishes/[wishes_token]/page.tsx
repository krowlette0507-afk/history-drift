"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";

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

  const prev = () => setLbIndex((i) => (i - 1 + items.length) % items.length);
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
            className="text-[10px] font-serif text-gold/50 hover:text-gold transition-colors">
            ⤢ Expand
          </button>
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
                <button type="button" onClick={prev}
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

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/wishes/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishes_token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.event) setEvent(d.event);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [wishes_token]);

  const images = event?.hero_images?.filter(Boolean) ?? [];
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!message.trim()) { setError("Please write a birthday message."); return; }
    setSaving(true);
    setError("");
    try {
      let media: { media_type: string; file_url: string; original_filename: string }[] = [];
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        formData.append("bucket", "celebrate-media");
        const upRes = await fetch("/api/celebrate/upload-image", { method: "POST", body: formData });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error ?? "Upload failed");
        media = [{ media_type: "image", file_url: upData.url, original_filename: photoFile.name }];
      }
      const res = await fetch("/api/wishes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishes_token, name, relationship, message, media }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

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
      <div className="relative rounded-2xl overflow-hidden" style={{ height: "220px" }}>
        {images.length > 0 ? (
          <>
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: i === slide ? 1 : 0, objectPosition: "center 20%" }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d1a08] to-[#0f0a04]" />
        )}
        <div className="absolute bottom-0 left-0 p-5">
          <p className="font-serif text-xs text-gold/60 uppercase tracking-widest mb-1">Birthday Wishes</p>
          <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text leading-tight">
            {event.honoree_name}
          </h1>
        </div>
      </div>

      {/* Invite to share */}
      <div className="text-center px-2">
        <p className="font-serif text-[#f5ead8]/70 text-sm leading-relaxed">
          Leave a birthday message for <strong className="text-gold/80 font-normal">{event.honoree_name}</strong>.
          Share this link with anyone who knows them — the more the merrier.
        </p>
      </div>

      {/* Wish form or confirmation */}
      {submitted ? (
        <div className="warm-glass rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">💛</div>
          <h2 className="font-serif text-lg font-semibold text-[#f5ead8]">Thank you, {name}!</h2>
          <p className="font-serif text-sm text-[#f5ead8]/60 leading-relaxed">
            Your birthday wish has been sent to {event.honoree_name}&rsquo;s family. They&rsquo;ll treasure it.
          </p>
          <div className="w-full pt-2">
            <p className="font-serif text-xs text-gold/40 mb-2">Know someone else who&apos;d like to wish {event.honoree_name} well?</p>
            <button
              type="button"
              onClick={copyLink}
              className="w-full py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
            >
              {copied ? "✓ Link Copied!" : "🔗 Copy & Share This Page"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">About you</p>
            <input type="text" placeholder="Your name *" value={name}
              onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
            <input type="text" placeholder="Your connection to Cecil (e.g. nephew, old friend)"
              value={relationship} onChange={(e) => setRelationship(e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>

          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Your message *</p>
            <textarea
              rows={4}
              placeholder={`Write your birthday message for ${event.honoree_name}…`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputClass + " resize-none"}
              style={inputStyle}
            />
          </div>

          {/* Optional photo */}
          <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Add a photo (optional)</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhotoPick} />
            {photoPreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={removePhoto}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">
                  ×
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full py-6 rounded-xl flex flex-col items-center gap-2 transition-all hover:border-gold/30"
                style={{ border: "2px dashed rgba(212,160,23,0.18)", background: "rgba(212,160,23,0.03)" }}>
                <span className="text-2xl">📷</span>
                <span className="font-serif text-xs text-gold/40">Tap to add a photo</span>
              </button>
            )}
          </div>

          {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}>
            {saving ? "Sending…" : `Send Your Wishes to ${event.honoree_name} 💛`}
          </button>
        </form>
      )}

      {/* Share link (before submission too) */}
      {!submitted && (
        <div className="warm-glass rounded-2xl p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[10px] text-gold/40 uppercase tracking-widest mb-0.5">Share this page</p>
            <p className="font-mono text-[10px] text-[#f5ead8]/30 truncate">{typeof window !== "undefined" ? window.location.href : ""}</p>
          </div>
          <button type="button" onClick={copyLink}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
            style={{ background: "rgba(212,160,23,0.1)", color: copied ? "#22c55e" : "rgba(212,160,23,0.6)" }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}

      {/* Photo carousel */}
      <CarouselSection eventId={event.id} />
    </div>
  );
}
