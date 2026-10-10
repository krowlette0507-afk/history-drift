export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#0a0704 0%,#1a1208 60%,#120d04 100%)" }}>
      <header className="sticky top-0 z-50 warm-glass border-b border-gold/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-gold text-sm font-serif">✦</span>
          <span className="font-serif text-sm font-semibold text-gold">History Drift</span>
          <span className="font-serif text-xs text-gold/30 ml-1">· Admin</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="py-8 text-center">
        <p className="text-xs font-serif" style={{ color: "rgba(212,160,23,0.2)" }}>
          History Drift Admin · Secure access only
        </p>
      </footer>
    </div>
  );
}
