"use client";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#0f0a04 0%,#1c1208 60%,#1a1006 100%)" }}>
      {children}
    </div>
  );
}
