import Navbar from "@/components/layout/Navbar";
import Onboarding from "@/components/Onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Onboarding />
      <Navbar />
      <div
        className="flex-1 md:ml-64 min-h-screen pt-28 pb-20 md:pt-0 md:pb-0"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}
      >
        {children}
      </div>
    </div>
  );
}
