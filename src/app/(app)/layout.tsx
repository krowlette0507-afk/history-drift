import Navbar from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navbar />
      <div className="flex-1 ml-64 min-h-screen" style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
        {children}
      </div>
    </div>
  );
}
