import Link from "next/link";

export default function WishesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#0f0a04 0%,#1c1208 60%,#1a1006 100%)" }}>
      <header className="sticky top-0 z-50 warm-glass border-b border-gold">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold">
            <span className="text-sm font-serif">✦</span>
            <span className="font-serif text-sm font-semibold">History Drift</span>
          </div>
          <Link
            href="/sign-in"
            className="text-xs font-serif transition-colors"
            style={{ color: "rgba(212,160,23,0.55)" }}
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
