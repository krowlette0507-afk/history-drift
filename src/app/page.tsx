"use client";

import { useState, useEffect, useRef, useCallback, RefObject } from "react";
import Link from "next/link";
import { INTERVIEWERS } from "@/data/interviewers";
import InterviewerModal from "@/components/home/InterviewerModal";
import { Interviewer } from "@/data/interviewers";

/* ─────────────────────────────────────────────────────────────────────
   Image layout hook — computes where the background photo actually
   renders so overlays align at any viewport size.
   New image: History Drift coffee shop scene with blank chalkboard.
   Update IMG_W / IMG_H after confirming saved file dimensions.
───────────────────────────────────────────────────────────────────── */
const IMG_W = 1456, IMG_H = 816;

interface Layout {
  renderedW: number; renderedH: number;
  offsetX:   number; offsetY:   number;
  cW: number;        cH: number;
}

function useImageLayout(containerRef: RefObject<HTMLElement | null>) {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const cW = el.offsetWidth, cH = el.offsetHeight;
      const imgRatio = IMG_W / IMG_H;
      const cRatio   = cW / cH;
      let renderedW: number, renderedH: number;
      if (cRatio >= imgRatio) { renderedW = cW;  renderedH = cW / imgRatio; }
      else                    { renderedH = cH;  renderedW = cH * imgRatio; }
      const offsetX = (cW - renderedW) * 0.5;
      const offsetY = (cH - renderedH) * 0.3;
      setLayout({ renderedW, renderedH, offsetX, offsetY, cW, cH });
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef]);

  const toRect = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      if (!layout) return null;
      const { renderedW, renderedH, offsetX, offsetY, cW, cH } = layout;
      const px = (p: number) => p * 0.01 * renderedW + offsetX;
      const py = (p: number) => p * 0.01 * renderedH + offsetY;
      const l = Math.max(0, px(x1));
      const t = Math.max(0, py(y1));
      const r = Math.min(cW, px(x2));
      const b = Math.min(cH, py(y2));
      if (r <= l || b <= t) return null;
      return { left: l, top: t, width: r - l, height: b - t };
    },
    [layout]
  );

  return { layout, toRect };
}

/* ─── Chalkboard nav panels ──────────────────────────────────────────
   Each panel covers one blank chalkboard section in the image.
   HTML labels are overlaid precisely — no hotspot math needed.
   Coordinates = % of original image dimensions (1456 × 816).
   Calibrated from the reference "home with text" image.
────────────────────────────────────────────────────────────────────── */
interface NavItem { label: string; desc: string; href: string; icon: string }
interface NavPanel { id: string; x1: number; y1: number; x2: number; y2: number; items: NavItem[] }

const NAV_PANELS: NavPanel[] = [
  {
    id: "left",
    x1: 8, y1: 10, x2: 27, y2: 52,
    items: [
      { label: "Dashboard",        desc: "Your story at a glance",               href: "/dashboard", icon: "⌂" },
      { label: "Interview Center", desc: "Start or continue AI conversations",   href: "/interview", icon: "◎" },
      { label: "Timeline",         desc: "Explore your life events",             href: "/timeline",  icon: "◷" },
      { label: "People",           desc: "Family, friends & important people",   href: "/people",    icon: "◉" },
    ],
  },
  {
    id: "center-left",
    x1: 24, y1: 10, x2: 44, y2: 52,
    items: [
      { label: "Places",           desc: "Where you've lived, traveled & explored", href: "/places",   icon: "◈" },
      { label: "Life Lessons",     desc: "Wisdom, values & lessons learned",        href: "/lessons",  icon: "◆" },
      { label: "Media Library",    desc: "Photos, videos, audio & documents",       href: "/media",    icon: "▣" },
    ],
  },
  {
    id: "center-right",
    x1: 54, y1: 10, x2: 71, y2: 52,
    items: [
      { label: "Biography",            desc: "Create beautiful stories & memoirs",      href: "/biography", icon: "◎" },
      { label: "Legacy Documents",    desc: "Letters, tributes & important wishes",    href: "/legacy",    icon: "◈" },
      { label: "Ask Me Anything",     desc: "Ask questions about your story",          href: "/ask",       icon: "◉" },
      { label: "Support & FAQs",       desc: "We're here to help",                      href: "/support",   icon: "?" },
    ],
  },
  {
    id: "right",
    x1: 69, y1: 10, x2: 82, y2: 52,
    items: [
      { label: "Family Vault",     desc: "Private sharing with family",    href: "/vault",      icon: "◆" },
      { label: "Notifications",   desc: "Updates & reminders",             href: "/dashboard",  icon: "◈" },
      { label: "Settings",        desc: "Customize your experience",       href: "/settings",   icon: "⚙" },
    ],
  },
];

/* ─── Interviewer clickable zones (% of image) ───────────────────── */
const INTERVIEWER_ZONES = [
  { id: "dr_james_carter",   x1: 3,  y1: 50, x2: 21, y2: 92 },
  { id: "professor_mei_lin", x1: 20, y1: 50, x2: 40, y2: 92 },
  { id: "sarah_bennett",     x1: 37, y1: 47, x2: 62, y2: 92 },
  { id: "miguel_alvarez",    x1: 58, y1: 50, x2: 78, y2: 92 },
  { id: "jordan_brooks",     x1: 75, y1: 50, x2: 96, y2: 92 },
];

/* ─── Re-Live example stories ───────────────────────────────────── */
const RELIVE_STORIES = [
  {
    id: "lost",
    title: "Lost",
    subtitle: "A Boy's Unexpected Adventure",
    src: "/examples/lost.jpg",
    panels: [
      { n: 1,  caption: "Kelvin, 13, heads into the woods alone for a morning of fishing." },
      { n: 2,  caption: "He follows a little creek deep into the forest, curious and carefree." },
      { n: 3,  caption: "The creek comes to an end. Kelvin isn't sure which way to go." },
      { n: 4,  caption: "The sun sets. Kelvin realizes with a sinking feeling — he is lost." },
      { n: 5,  caption: "He tries to find his way back, but every path looks the same." },
      { n: 6,  caption: "Night falls. Tired and scared, he sits against a tree and hopes." },
      { n: 7,  caption: "Through the dark trees, he spots headlights moving in the distance." },
      { n: 8,  caption: "He runs to the road, waving frantically. A kind man stops to help." },
      { n: 9,  caption: "Safe in the car, Kelvin tells the man what happened. Relief floods in." },
      { n: 10, caption: "They arrive home. His mother rushes out in tears, his father close behind." },
      { n: 11, caption: "Kelvin is safe. His family pulls him into a hug that says everything." },
      { n: 12, caption: "Years later, Kelvin shares the story — the one that taught him courage." },
    ],
  },
  {
    id: "bully",
    title: "The Bully",
    subtitle: "How Sammy Let His Actions Speak Louder",
    src: "/examples/bully.jpg",
    panels: [
      { n: 1,  caption: "Sammy, 13, arrives in a new neighborhood — boxes outside, fresh start ahead." },
      { n: 2,  caption: "He makes friends fast. Laughter, jokes, and finally a place to belong." },
      { n: 3,  caption: "On the bus, Sammy sits next to Cathy. They talk about everything." },
      { n: 4,  caption: "Kerry, a year older and bigger, looms over them — throwing things, sneering." },
      { n: 5,  caption: "Sammy feels the anger rise, but holds it in. He won't give Kerry power." },
      { n: 6,  caption: "Sammy walks into the wrestling room and signs up. A decision that changes everything." },
      { n: 7,  caption: "Practice is hard. He learns, falls, gets back up. His coach sees the heart in him." },
      { n: 8,  caption: "At the state tournament, Sammy earns third place. He stands tall and proud." },
      { n: 9,  caption: "Back on the bus, Sammy stands up and faces Kerry — calm, steady, and confident." },
      { n: 10, caption: "Kerry's smirk fades. For the first time, he backs down without a word." },
      { n: 11, caption: "The tension breaks. The whole bus exhales. Respect is earned, not taken." },
      { n: 12, caption: "Years later, Sammy carries that quiet strength into everything he does." },
    ],
  },
  {
    id: "stage",
    title: "Passion for the Stage",
    subtitle: "From the Background to the Spotlight",
    src: "/examples/stage.jpg",
    panels: [
      { n: 1,  caption: "Jessica, 16, watches rehearsals from the seats — always in the background." },
      { n: 2,  caption: "She helps with costumes, lines, and anything anyone needs. Quietly devoted." },
      { n: 3,  caption: "She coaches others through their lines, never once expecting the spotlight herself." },
      { n: 4,  caption: "The drama teacher pins the cast list. The lead actress name is crossed out." },
      { n: 5,  caption: "The teacher turns to Jessica with a hopeful look. Just two weeks to go." },
      { n: 6,  caption: "Jessica is shocked. She never imagined it could be her — not once." },
      { n: 7,  caption: "Then the terror sets in. Can she really do this?" },
      { n: 8,  caption: "She rehearses alone in her room, learning every line, every note, every breath." },
      { n: 9,  caption: "Her family gathers around the table — running lines with her, believing when she doubts." },
      { n: 10, caption: "Final dress rehearsal. Backstage, the nerves are almost too much to bear." },
      { n: 11, caption: "The curtain rises. The spotlight finds her. Jessica is Annie." },
      { n: 12, caption: "Mid-show, she finds her voice. The audience leans forward as one." },
      { n: 13, caption: "The final bow. A standing ovation. Flowers fly. Tears fill the crowd." },
      { n: 14, caption: "Overwhelmed with gratitude, Jessica hugs the flowers to her chest." },
      { n: 15, caption: "Years later, still doing what she loves. Dreams really do come true." },
      { n: 16, caption: "From the background to the spotlight — Jessica's story is just the beginning." },
    ],
  },
];

/* ─── Trust bar ──────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  {
    icon: <svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 1 L18 5 L18 10 Q18 16 10 19 Q2 16 2 10 L2 5 Z" fill="none" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 10 L9 12 L13 8" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    title: "Privacy First",  desc: "Your story is private, secure & protected.",              href: "/security",
  },
  {
    icon: <svg viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="8" r="4" fill="none" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5"/><circle cx="4" cy="14" r="2.5" fill="none" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5"/><circle cx="16" cy="14" r="2.5" fill="none" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5"/><path d="M2 19 Q7 16 13 16 Q16 16 18 19" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>,
    title: "Built For You",  desc: "Personalized interviews that adapt to you.",               href: "/interview",
  },
  {
    icon: <svg viewBox="0 0 20 20" width="18" height="18"><circle cx="10" cy="10" r="6" fill="none" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5"/><circle cx="10" cy="10" r="2" fill="rgba(212,160,23,0.7)"/><path d="M10 2 L10 4 M10 16 L10 18 M2 10 L4 10 M16 10 L18 10" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    title: "Voice or Text",  desc: "Share your story the way you feel comfortable.",          href: "/interview",
  },
  {
    icon: <svg viewBox="0 0 20 20" width="18" height="18"><rect x="4" y="7" width="12" height="10" rx="2" fill="none" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5"/><path d="M7 7 L7 5 Q7 2 10 2 Q13 2 13 5 L13 7" stroke="rgba(212,160,23,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="10" cy="12" r="1.5" fill="rgba(212,160,23,0.7)"/></svg>,
    title: "Legacy Secure",  desc: "Your story is preserved today for tomorrow.",             href: "/legacy",
  },
  {
    icon: <svg viewBox="0 0 20 20" width="18" height="18"><path d="M10 3 L11.5 7.5 L16 7.5 L12.5 10.5 L14 15 L10 12 L6 15 L7.5 10.5 L4 7.5 L8.5 7.5 Z" fill="rgba(160,80,200,0.3)" stroke="rgba(180,100,220,0.8)" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
    title: "Re-Live", desc: "Turn memories into illustrated storyboards.", href: "/relive",
  },
];

/* ─── Portrait photo map ─────────────────────────────────────────── */
const PHOTO_MAP: Record<string, string> = {
  dr_james_carter:   "/images/interviewers/dr-carter.jpg",
  professor_mei_lin: "/images/interviewers/prof-mei-lin.jpg",
  sarah_bennett:     "/images/interviewers/sarah-bennett.jpg",
  miguel_alvarez:    "/images/interviewers/miguel-alvarez.jpg",
  jordan_brooks:     "/images/interviewers/jordan-brooks.jpg",
};

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toRect }   = useImageLayout(containerRef as RefObject<HTMLElement | null>);

  const [hoveredIv, setHoveredIv] = useState<string | null>(null);
  const [modalIv,   setModalIv]   = useState<Interviewer | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <>
      {modalIv && <InterviewerModal interviewer={modalIv} onClose={() => setModalIv(null)} />}

      {/* ── Mobile home page ─────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col min-h-screen" style={{ background: "#0a0602" }}>
        {/* Hero */}
        <div className="relative flex-1 flex flex-col overflow-hidden" style={{ minHeight: "60vh" }}>
          <div className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/homepage-scene.webp')",
              backgroundSize: "cover",
              backgroundPosition: "55% center",
            }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,3,1,0.55) 0%, rgba(5,3,1,0.1) 40%, rgba(5,3,1,0.7) 80%, rgba(5,3,1,0.98) 100%)" }} />

          {/* Header */}
          <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7a4a12,#c07a2a)" }}>
                <span className="text-amber-100 font-serif font-bold text-xs">HD</span>
              </div>
              <span className="text-amber-200 font-serif font-semibold text-base">History Drift</span>
            </div>
            <Link href="/sign-in" className="font-serif text-sm px-4 py-1.5 rounded-lg"
              style={{ color: "rgba(200,160,80,.85)", border: "1px solid rgba(120,80,30,.4)" }}>
              Sign In
            </Link>
          </header>

          {/* Tagline */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-6 pb-8 text-center">
            <h1 className="font-serif font-bold text-amber-100 leading-tight mb-3" style={{ fontSize: "2.2rem" }}>
              Your Story.<br />Your Legacy.
            </h1>
            <p className="font-serif italic text-sm mb-6" style={{ color: "rgba(200,165,100,0.8)" }}>
              Reflect on your past. Share your experiences.<br />Inspire future generations.
            </p>
            <Link href="/sign-up"
              className="px-8 py-3.5 rounded-xl font-serif font-semibold text-amber-50 text-base"
              style={{ background: "linear-gradient(135deg,#7a4a12,#c07a2a)", boxShadow: "0 4px 20px rgba(120,70,18,0.5)" }}>
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Interviewer strip */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-amber-700/50 text-xs font-sans uppercase tracking-widest mb-3">Meet your interviewers</p>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {INTERVIEWERS.map((iv) => (
              <Link key={iv.id} href="/sign-up"
                className="flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl border"
                style={{ width: 90, borderColor: "rgba(90,52,20,0.3)", background: "rgba(15,10,4,0.6)" }}>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: `${iv.accentColor}50` }}>
                  <img src={PHOTO_MAP[iv.id]} alt={iv.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
                </div>
                <span className="text-[10px] font-serif text-center leading-tight" style={{ color: "rgba(200,160,90,0.9)" }}>
                  {iv.name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Nav grid */}
        <div className="px-4 pt-3 pb-8 grid grid-cols-2 gap-2">
          {[
            { label: "Interview Center", desc: "Start your story", href: "/interview", icon: "◎" },
            { label: "Timeline",         desc: "Your life events",  href: "/timeline",  icon: "◷" },
            { label: "Biography",        desc: "Your life story",   href: "/biography", icon: "◆" },
            { label: "Family Vault",     desc: "Share with family", href: "/vault",     icon: "▣" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 p-3 rounded-xl border"
              style={{ borderColor: "rgba(90,52,20,0.25)", background: "rgba(15,10,4,0.5)" }}>
              <span style={{ color: "rgba(180,130,50,0.7)", fontSize: 14 }}>{item.icon}</span>
              <div>
                <div className="text-[11px] font-sans font-semibold text-amber-300/80">{item.label}</div>
                <div className="text-[9px] font-sans text-amber-800/50">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Desktop home page ─────────────────────────────────────────── */}
      <main
        ref={containerRef}
        className="hidden md:block overflow-hidden"
        style={{ height: "100dvh", minHeight: "600px", background: "#0a0602", position: "relative" }}
      >
        {/* ── Background photo ──────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/homepage-scene.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center 30%",
            backgroundRepeat: "no-repeat",
            opacity: 0.96,
          }}
        />

        {/* ── Gradient overlays ─────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0"
            style={{ height: "18%", background: "linear-gradient(180deg,rgba(5,3,1,.65) 0%,rgba(5,3,1,.15) 70%,transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0"
            style={{ height: "16%", background: "linear-gradient(0deg,rgba(5,3,1,.98) 0%,rgba(5,3,1,.5) 70%,transparent 100%)" }} />
          <div className="absolute inset-y-0 left-0 w-[6%]"
            style={{ background: "linear-gradient(90deg,rgba(0,0,0,.35) 0%,transparent 100%)" }} />
          <div className="absolute inset-y-0 right-0 w-[6%]"
            style={{ background: "linear-gradient(270deg,rgba(0,0,0,.35) 0%,transparent 100%)" }} />
        </div>

        {/* ── Header nav (Sign In / Get Started only — logo is in image) ── */}
        <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-end px-8 pt-4 pb-2">
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="font-serif text-sm px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ color: "rgba(200,160,80,.85)", border: "1px solid rgba(120,80,30,.4)" }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="font-serif text-sm font-semibold px-4 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg,#7a4a12,#c07a2a)",
                color: "rgba(245,234,216,.95)",
                boxShadow: "0 2px 12px rgba(120,70,18,.4)",
              }}
            >
              Get Started
            </Link>
          </nav>
        </header>

        {/* ══ CHALKBOARD NAV — HTML labels over blank panels ═══════════
            Each panel container is positioned using toRect() to perfectly
            cover one blank chalkboard section in the background image.
            Items are laid out inside with flexbox — zero alignment math.
        ════════════════════════════════════════════════════════════════ */}
        {NAV_PANELS.map((panel) => {
          const rect = toRect(panel.x1, panel.y1, panel.x2, panel.y2);
          if (!rect) return null;
          return (
            <div
              key={panel.id}
              className="absolute z-10 flex flex-col justify-around"
              style={{
                left:    rect.left,
                top:     rect.top,
                width:   rect.width,
                height:  rect.height,
                padding: "4% 5%",
              }}
            >
              {panel.items.map((item) => {
                const key = `${panel.id}-${item.label}`;
                const isHov = hoveredNav === key;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-2 group transition-all duration-150"
                    style={{ opacity: isHov ? 1 : 0.88, transform: isHov ? "translateX(2px)" : "none" }}
                    onMouseEnter={() => setHoveredNav(key)}
                    onMouseLeave={() => setHoveredNav(null)}
                  >
                    {/* Icon */}
                    <span
                      className="flex-shrink-0 mt-0.5"
                      style={{
                        fontSize: "clamp(11px, 1.1vw, 16px)",
                        color: isHov ? "rgba(232,180,60,1)" : "rgba(200,150,50,0.75)",
                        lineHeight: 1,
                      }}
                    >
                      {item.icon}
                    </span>

                    {/* Label + description */}
                    <div>
                      <div
                        className="font-sans font-bold leading-none"
                        style={{
                          fontSize:      "clamp(9px, 1vw, 14px)",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          whiteSpace:    "nowrap",
                          color: isHov ? "rgba(240,190,80,1)" : "rgba(210,165,70,0.9)",
                          textShadow: isHov ? "0 0 12px rgba(212,160,23,0.5)" : "none",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="font-sans leading-tight mt-0.5"
                        style={{
                          fontSize: "clamp(8px, 0.85vw, 12px)",
                          color:    isHov ? "rgba(200,165,100,0.85)" : "rgba(175,140,80,0.65)",
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* ── INTERVIEWER ZONES — hover to reveal name + CTA ─────── */}
        {INTERVIEWERS.map((iv) => {
          const zone = INTERVIEWER_ZONES.find((z) => z.id === iv.id);
          if (!zone) return null;
          const rect = toRect(zone.x1, zone.y1, zone.x2, zone.y2);
          if (!rect) return null;
          const isHov = hoveredIv === iv.id;

          return (
            <div
              key={iv.id}
              className="absolute z-10 cursor-pointer flex flex-col justify-end"
              style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
              onMouseEnter={() => setHoveredIv(iv.id)}
              onMouseLeave={() => setHoveredIv(null)}
              onClick={() => setModalIv(iv)}
            >
              {/* Subtle vignette on hover */}
              <div
                className="absolute inset-0 rounded-sm transition-all duration-300"
                style={{
                  background: isHov ? "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.45) 100%)" : "transparent",
                  border:     isHov ? "1px solid rgba(212,160,23,0.2)" : "1px solid transparent",
                }}
              />

              {/* Name / title pill */}
              {isHov && (
                <div
                  className="relative z-10 mx-2 mb-3 px-3 py-2 rounded-xl text-center"
                  style={{
                    background:   "rgba(8,4,1,0.82)",
                    border:       "1px solid rgba(212,160,23,0.3)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div
                    className="font-serif font-semibold leading-tight"
                    style={{ fontSize: "clamp(9px,1vw,13px)", color: "rgba(232,195,100,0.95)" }}
                  >
                    {iv.name}
                  </div>
                  <div
                    className="font-sans leading-tight mt-0.5"
                    style={{ fontSize: "clamp(7px,0.65vw,9px)", color: "rgba(180,140,70,0.8)" }}
                  >
                    {iv.title}
                  </div>
                  <div
                    className="font-sans font-semibold mt-1.5"
                    style={{
                      fontSize:      "clamp(7px,0.6vw,9px)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color:         "rgba(212,160,23,0.9)",
                    }}
                  >
                    Click to Begin →
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Trust bar ─────────────────────────────────────────── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center"
          style={{
            height:     "13%",
            background: "rgba(6,3,1,0.88)",
            borderTop:  "1px solid rgba(90,52,20,0.3)",
          }}
        >
          {TRUST_ITEMS.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="flex-1 flex items-center gap-2.5 px-4 transition-all hover:opacity-90 group"
              style={{ borderRight: "1px solid rgba(80,44,14,0.25)" }}
            >
              <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                {t.icon}
              </div>
              <div>
                <div
                  className="font-sans font-bold leading-none"
                  style={{
                    fontSize:      "clamp(8px, 0.75vw, 11px)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color:         "rgba(210,165,70,0.9)",
                  }}
                >
                  {t.title}
                </div>
                <div
                  className="font-sans leading-tight mt-0.5"
                  style={{ fontSize: "clamp(7px, 0.6vw, 9px)", color: "rgba(160,120,60,0.7)" }}
                >
                  {t.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
