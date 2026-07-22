"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";
import { getSessions } from "@/lib/storage";
import { Mic, BookOpen, Clock, Users, MapPin, Lightbulb, Scroll, Lock, HelpCircle, LayoutDashboard, Settings, Bell, X, Menu, Sparkles, Heart } from "lucide-react";

const NOTIF_KEY = "ls_notif_seen_at";

const NAV_ITEMS: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; highlight?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/relive", label: "Re-Live", icon: Sparkles, highlight: true },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/people", label: "People", icon: Users },
  { href: "/places", label: "Places", icon: MapPin },
  { href: "/lessons", label: "Life Lessons", icon: Lightbulb },
  { href: "/biography", label: "Biography", icon: BookOpen },
  { href: "/legacy", label: "Legacy", icon: Scroll },
  { href: "/family", label: "Family Memories", icon: Heart },
  { href: "/vault", label: "Family Vault", icon: Lock },
  { href: "/ask", label: "Ask Me Anything", icon: HelpCircle },
  { href: "/support", label: "Support & FAQs", icon: BookOpen },
];

const BOTTOM_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/interview", label: "Interview", icon: Mic },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/biography", label: "Story", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    const sessions = getSessions();
    const incomplete = sessions.find(s => !s.completedAt);
    setHasActiveSession(!!incomplete);
  }, [pathname]);

  useEffect(() => {
    async function checkNotifications() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const seenAt = localStorage.getItem(NOTIF_KEY) ?? "1970-01-01";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      // Get user's invite IDs first
      const { data: invites } = await sb
        .from("family_invites")
        .select("id")
        .eq("user_id", session.user.id);
      if (!invites?.length) return;
      const inviteIds = invites.map((i: { id: string }) => i.id);
      const { count } = await sb
        .from("family_contributions")
        .select("id", { count: "exact", head: true })
        .in("invite_id", inviteIds)
        .gt("created_at", seenAt);
      setUnreadCount(count ?? 0);
    }
    checkNotifications();
  }, [pathname]);

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-stone-950 via-amber-950/30 to-stone-950 border-r border-amber-900/30 flex-col z-40">
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
        <div className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            if (highlight) {
              return (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-serif transition-all duration-150 mx-2 rounded-xl my-1"
                  style={{
                    background: active ? "linear-gradient(135deg, rgba(122,45,138,0.6), rgba(200,74,154,0.4))" : "linear-gradient(135deg, rgba(122,45,138,0.2), rgba(200,74,154,0.15))",
                    border: "1px solid rgba(200,74,154,0.3)",
                    color: active ? "#f0a0d8" : "#c878c0",
                  }}>
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{label}</span>
                  {!active && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-sans" style={{ background: "rgba(200,74,154,0.25)", color: "#e879c0" }}>NEW</span>}
                </Link>
              );
            }
            return (
              <Link key={href} href={href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 text-sm font-serif transition-all duration-150",
                  active
                    ? "bg-amber-900/40 text-amber-200 border-r-2 border-amber-500"
                    : "text-amber-700 hover:text-amber-300 hover:bg-amber-950/50"
                )}>
                <Icon size={16} className="flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-amber-900/30 p-4 flex gap-2">
          <Link href="/family" onClick={() => { localStorage.setItem(NOTIF_KEY, new Date().toISOString()); setUnreadCount(0); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-amber-700 hover:text-amber-400 text-xs transition-colors relative">
            <Bell size={14} />
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "#c84a9a", color: "white" }}>{unreadCount}</span>
            )}
          </Link>
          <Link href="/settings" className="flex-1 flex items-center justify-center gap-2 py-2 text-amber-700 hover:text-amber-400 text-xs transition-colors">
            <Settings size={14} /><span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex flex-col"
        style={{ background: "rgba(10,6,2,0.97)", borderBottom: "1px solid rgba(101,67,20,0.3)", backdropFilter: "blur(8px)" }}>
        {/* Row 1: logo + icons */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
              <span className="text-amber-100 font-serif font-bold text-xs">HD</span>
            </div>
            <span className="text-amber-200 font-serif font-semibold text-base">History Drift</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/family" onClick={() => { localStorage.setItem(NOTIF_KEY, new Date().toISOString()); setUnreadCount(0); }}
              className="relative p-1 text-amber-600">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: "#c84a9a", color: "white" }}>{unreadCount}</span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(true)} className="text-amber-600 p-1">
              <Menu size={22} />
            </button>
          </div>
        </div>
        {/* Row 2: Interview CTA — hidden on the interview page itself */}
        {pathname !== "/interview" && (
          <div className="px-4 pb-3">
            <Link href="/interview"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-serif font-bold text-base transition-all active:scale-95"
              style={{
                background: hasActiveSession
                  ? "linear-gradient(135deg, #5a8a20, #8ac030)"
                  : "linear-gradient(135deg, #8a5021, #c8843a)",
                color: "white",
                boxShadow: hasActiveSession
                  ? "0 4px 20px rgba(100,180,30,0.35)"
                  : "0 4px 20px rgba(180,100,30,0.35)",
              }}>
              <Mic size={18} />
              {hasActiveSession ? "Continue Interview →" : "Start Interview →"}
            </Link>
          </div>
        )}
      </div>

      {/* ── Mobile full-screen menu ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(8,5,2,0.98)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-900/30">
            <span className="text-amber-200 font-serif font-semibold text-lg">Menu</span>
            <button onClick={() => setMenuOpen(false)} className="text-amber-600"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 text-base font-serif transition-all",
                    highlight
                      ? active ? "text-pink-300" : "text-pink-500"
                      : active ? "text-amber-200 bg-amber-900/30" : "text-amber-600 hover:text-amber-300"
                  )}>
                  <Icon size={20} className="flex-shrink-0" />
                  <span>{label}</span>
                  {highlight && !active && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-sans" style={{ background: "rgba(200,74,154,0.2)", color: "#e879c0" }}>NEW</span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="border-t border-amber-900/30 p-4 flex gap-3">
            <Link href="/settings" onClick={() => setMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-amber-700 text-sm font-serif rounded-xl"
              style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
              <Settings size={16} /><span>Settings</span>
            </Link>
            <Link href="/notifications" onClick={() => setMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-amber-700 text-sm font-serif rounded-xl"
              style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
              <Bell size={16} /><span>Alerts</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Mobile bottom tab bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: "rgba(10,6,2,0.97)", borderTop: "1px solid rgba(101,67,20,0.3)", backdropFilter: "blur(8px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
              style={{ color: active ? "#d4a017" : "rgba(210,165,60,0.75)" }}>
              <Icon size={20} />
              <span className="text-[10px] font-sans">{label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
          style={{ color: "rgba(210,165,60,0.75)" }}>
          <Menu size={20} />
          <span className="text-[10px] font-sans">More</span>
        </button>
      </div>
    </>
  );
}
