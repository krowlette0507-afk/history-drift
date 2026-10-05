"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  storyteller_name: string;
  created_at: string;
}

export default function GalleryPage() {
  const { token } = useParams<{ token: string }>();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch("/api/celebrate/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, [token]);

  const closeLightbox = () => setLightbox(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gold/40 font-serif text-sm animate-pulse">Loading gallery…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text">Photo Gallery</h1>
        <span className="font-serif text-xs text-gold/40">{items.length} photo{items.length !== 1 ? "s" : ""}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gold/40 font-serif text-lg mb-2">No photos yet.</p>
          <p className="text-gold/25 font-serif text-sm mb-6">Be the first to share a memory.</p>
          <Link
            href={`/celebrate/${token}/share-memory/photo`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04]"
            style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
          >
            📷 Share a Photo
          </Link>
        </div>
      ) : (
        <>
          {/* Masonry-style grid */}
          <div className="columns-2 gap-2 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => setLightbox(item)}
              >
                <img
                  src={item.url}
                  alt={item.caption || ""}
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {(item.caption || item.storyteller_name) && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 group-hover:translate-y-0 transition-transform">
                    {item.caption && (
                      <p className="font-serif text-[11px] text-[#f5ead8] leading-tight">{item.caption}</p>
                    )}
                    <p className="font-serif text-[10px] text-gold/60 mt-0.5">— {item.storyteller_name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Link
            href={`/celebrate/${token}/share-memory/photo`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-serif text-[#f5ead8] warm-glass transition-colors"
            style={{ border: "1px solid rgba(212,160,23,0.25)" }}
          >
            📷 Add Your Photos
          </Link>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption || ""}
              className="w-full rounded-2xl"
            />
            {(lightbox.caption || lightbox.storyteller_name) && (
              <div className="mt-3 px-1">
                {lightbox.caption && (
                  <p className="font-serif text-sm text-[#f5ead8]/80">{lightbox.caption}</p>
                )}
                <p className="font-serif text-xs text-gold/50 mt-1">— {lightbox.storyteller_name}</p>
              </div>
            )}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
