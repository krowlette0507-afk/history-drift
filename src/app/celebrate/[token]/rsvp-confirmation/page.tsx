"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function RsvpConfirmationPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="flex flex-col items-center gap-6 text-center py-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
      >
        🎉
      </div>

      <div>
        <h1 className="font-serif text-2xl font-bold text-[#f5ead8] chalk-text mb-2">You're on the list!</h1>
        <p className="font-serif text-[#f5ead8]/70 text-sm leading-relaxed max-w-sm">
          Your RSVP has been received. We're so excited to celebrate with you.
          You'll receive a confirmation by email or text.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href={`/celebrate/${token}/share-memory`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
        >
          📸 Share a Memory
        </Link>
        <Link
          href={`/celebrate/${token}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-serif text-[#f5ead8] warm-glass transition-colors"
          style={{ border: "1px solid rgba(212,160,23,0.25)" }}
        >
          ← Back to Invitation
        </Link>
      </div>

      <p className="font-serif text-xs text-gold/30 mt-4">
        See you there!
      </p>
    </div>
  );
}
