"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CelebrateLayout({ children }: { children: React.ReactNode }) {
  const [eventTitle, setEventTitle] = useState<string | null>(null);

  useEffect(() => {
    const token = window.location.pathname.split("/").find((s) => s.length > 20) ?? "";
    fetch("/api/celebrate/invitation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.event?.title) setEventTitle(d.event.title); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#0f0a04 0%,#1c1208 60%,#1a1006 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 warm-glass border-b border-gold">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gold hover:text-[#f0d060] transition-colors">
            <span className="text-sm font-serif">✦</span>
            <span className="font-serif text-sm font-semibold">
              {eventTitle ?? "History Drift"}
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="text-xs font-serif text-[rgba(212,160,23,0.55)] hover:text-gold transition-colors"
          >
            Host Login →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="py-8 text-center">
        <p className="text-xs font-serif" style={{ color: "rgba(212,160,23,0.3)" }}>
          Powered by History Drift · Every life has a story worth preserving
        </p>
      </footer>
    </div>
  );
}
