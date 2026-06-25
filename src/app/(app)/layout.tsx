import Navbar from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      {/* Desktop: offset by sidebar width. Mobile: add top bar + bottom tab bar padding. */}
      <div
        className="flex-1 md:ml-64 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}
      >
        {children}
      </div>
    </div>
  );
}
