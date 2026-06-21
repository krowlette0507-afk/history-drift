"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Mic, BookOpen, Clock, Users, MapPin, Lightbulb, Library, Scroll, Lock, HelpCircle, LayoutDashboard, Settings, Bell } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/people", label: "People", icon: Users },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/lessons", label: "Life Lessons", icon: Lightbulb },
  { href: "/biography", label: "Biography", icon: BookOpen },
  { href: "/legacy", label: "Legacy", icon: Scroll },
  { href: "/vault", label: "Family Vault", icon: Lock },
  { href: "/ask", label: "Ask Me Anything", icon: HelpCircle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-stone-950 via-amber-950/30 to-stone-950 border-r border-amber-900/30 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-amber-900/30">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
            <span className="text-amber-100 font-serif font-bold text-sm">HD</span>
          </div>
          <div>
            <div className="text-amber-200 font-serif font-semibold text-lg leading-tight">History Drift</div>
            <div className="text-amber-700 text-xs">Every life has a story worth preserving.</div>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-5 py-3 text-sm font-serif transition-all duration-150 group",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-amber-900/40 text-amber-200 border-r-2 border-amber-500"
                : "text-amber-700 hover:text-amber-300 hover:bg-amber-950/50"
            )}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-amber-900/30 p-4 flex gap-2">
        <Link href="/notifications" className="flex-1 flex items-center justify-center gap-2 py-2 text-amber-700 hover:text-amber-400 text-xs transition-colors">
          <Bell size={14} />
          <span>Alerts</span>
        </Link>
        <Link href="/settings" className="flex-1 flex items-center justify-center gap-2 py-2 text-amber-700 hover:text-amber-400 text-xs transition-colors">
          <Settings size={14} />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
}
