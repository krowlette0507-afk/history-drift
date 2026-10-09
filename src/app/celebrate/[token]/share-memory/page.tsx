"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ShareMemoryPage() {
  const { token } = useParams<{ token: string }>();
  const [wishesToken, setWishesToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/celebrate/invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => setWishesToken(d.event?.wishes_token ?? null));
  }, [token]);

  const wishesUrl = wishesToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/wishes/${wishesToken}`
    : null;

  const copyWishes = () => {
    if (!wishesUrl) return;
    navigator.clipboard?.writeText(wishesUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text mb-2">Share a Memory</h1>
        <p className="font-serif text-[#f5ead8]/60 text-sm leading-relaxed max-w-xs mx-auto">
          Help us build a living tribute — a story or photo that will be treasured for generations.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href={`/celebrate/${token}/share-memory/tell`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}
          >
            ✍
          </div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Tell a Story
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Share a memory in your own words — type it out or record yourself telling it.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>

        <Link
          href={`/celebrate/${token}/share-memory/photo`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}
          >
            📷
          </div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Share a Photo
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Upload a photo or screenshot from your camera roll. Add a caption if you&apos;d like.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>

        <Link
          href={`/celebrate/${token}/share-memory/video`}
          className="warm-glass rounded-2xl p-6 flex items-start gap-4 transition-all hover:border-gold/40 group"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}
          >
            🎬
          </div>
          <div>
            <h2 className="font-serif font-semibold text-[#f5ead8] mb-1 group-hover:text-gold transition-colors">
              Record a Video Message
            </h2>
            <p className="font-serif text-xs text-[#f5ead8]/50 leading-relaxed">
              Record up to 30 seconds right from your camera — say happy birthday or share a memory in your own voice.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>
      </div>

      {/* Best Wishes share */}
      {wishesUrl && (
        <div className="warm-glass rounded-2xl p-5 flex items-center gap-4"
          style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
          <span className="text-2xl flex-shrink-0">🎂</span>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm font-semibold text-[#f5ead8]">Share the Best Wishes Link</p>
            <p className="font-serif text-xs text-[#f5ead8]/45 mt-0.5 leading-relaxed">
              Know someone who can&apos;t attend? They can still send a birthday wish.
            </p>
          </div>
          <button type="button" onClick={copyWishes}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-serif text-xs transition-colors"
            style={{ background: "rgba(212,160,23,0.1)", color: copied ? "#22c55e" : "rgba(212,160,23,0.6)" }}>
            {copied ? "✓ Copied" : "Copy Link"}
          </button>
        </div>
      )}

      <Link
        href={`/celebrate/${token}`}
        className="text-center font-serif text-xs text-gold/30 hover:text-gold/60 transition-colors"
      >
        ← Back to invitation
      </Link>
    </div>
  );
}
