"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function ShareMemoryPage() {
  const { token } = useParams<{ token: string }>();

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
              Upload a photo or screenshot from your camera roll. Add a caption if you'd like.
            </p>
          </div>
          <span className="ml-auto text-gold/30 group-hover:text-gold/60 transition-colors self-center">→</span>
        </Link>
      </div>

      <Link
        href={`/celebrate/${token}`}
        className="text-center font-serif text-xs text-gold/30 hover:text-gold/60 transition-colors"
      >
        ← Back to invitation
      </Link>
    </div>
  );
}
