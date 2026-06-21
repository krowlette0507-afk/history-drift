"use client";

import Link from "next/link";
import { MENU_BOARD_SECTIONS } from "@/data/interviewers";

export default function ChalkboardMenu() {
  return (
    <div
      className="relative w-full rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(170deg, #0d0902 0%, #130c05 35%, #0f0a04 70%, #0c0803 100%)",
        border: "3px solid #3a2408",
        boxShadow: [
          "0 0 0 1px rgba(212,160,23,0.06)",
          "inset 0 0 60px rgba(0,0,0,0.6)",
          "inset 0 1px 0 rgba(212,160,23,0.12)",
          "0 20px 60px rgba(0,0,0,0.7)",
        ].join(", "),
      }}
    >
      {/* Subtle chalk texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,234,216,0.5) 2px, rgba(245,234,216,0.5) 3px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Wooden frame top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ background: "linear-gradient(180deg, #5a3408 0%, #3a2010 100%)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-2"
        style={{ background: "linear-gradient(0deg, #5a3408 0%, #3a2010 100%)" }}
      />
      <div
        className="absolute top-0 bottom-0 left-0 w-2"
        style={{ background: "linear-gradient(90deg, #5a3408 0%, #3a2010 100%)" }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-2"
        style={{ background: "linear-gradient(270deg, #5a3408 0%, #3a2010 100%)" }}
      />

      {/* Top tagline bar */}
      <div
        className="relative z-10 py-2 text-center border-b"
        style={{
          borderColor: "rgba(212,160,23,0.12)",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <span
          className="text-[11px] font-sans uppercase tracking-[0.45em]"
          style={{
            color: "rgba(212,160,23,0.55)",
            textShadow: "0 0 10px rgba(212,160,23,0.2)",
          }}
        >
          Capture &nbsp;·&nbsp; Preserve &nbsp;·&nbsp; Share Your Legacy
        </span>
      </div>

      {/* Main board grid: 4 nav columns + center feature */}
      <div className="relative z-10 grid grid-cols-[1fr_1fr_auto_1fr_1fr]" style={{ borderTop: "0" }}>

        {/* Left two nav columns */}
        {MENU_BOARD_SECTIONS.slice(0, 2).map((section) => (
          <div key={section.column} className="p-3" style={{ borderRight: "1px solid rgba(212,160,23,0.08)" }}>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-amber-950/30"
                  >
                    <div
                      className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] group-hover:text-amber-300 transition-colors"
                      style={{
                        color: "rgba(235,215,170,0.82)",
                        textShadow: "1px 1px 0 rgba(0,0,0,0.8), 0 0 6px rgba(245,234,216,0.06)",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-[9.5px] font-sans mt-0.5 leading-tight"
                      style={{ color: "rgba(180,140,80,0.55)" }}
                    >
                      {item.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Center feature piece */}
        <div
          className="px-6 py-3 flex flex-col items-center justify-center min-w-[200px] relative"
          style={{ borderLeft: "1px solid rgba(212,160,23,0.12)", borderRight: "1px solid rgba(212,160,23,0.12)" }}
        >
          {/* Decorative tree / family tree SVG */}
          <div className="mb-3">
            <svg viewBox="0 0 80 70" width="70" height="61" className="opacity-30">
              {/* Trunk */}
              <rect x="37" y="48" width="6" height="22" rx="3" fill="rgba(212,160,23,0.8)" />
              {/* Main branches */}
              <path d="M40 48 Q28 38 20 28" stroke="rgba(212,160,23,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M40 48 Q52 38 60 28" stroke="rgba(212,160,23,0.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M40 42 Q36 34 32 26" stroke="rgba(212,160,23,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M40 42 Q44 34 48 26" stroke="rgba(212,160,23,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M40 36 Q38 28 38 18" stroke="rgba(212,160,23,0.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {/* Sub-branches */}
              <path d="M20 28 Q14 22 10 14" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M20 28 Q22 18 24 12" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M60 28 Q66 22 70 14" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M60 28 Q58 18 56 12" stroke="rgba(212,160,23,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Leaf dots */}
              {[
                [10, 12], [24, 10], [38, 14], [56, 10], [70, 12],
                [14, 6], [22, 4], [40, 6], [58, 4], [66, 6],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3.5" fill="rgba(212,160,23,0.4)" />
              ))}
            </svg>
          </div>

          {/* Cursive-style headline */}
          <div className="text-center">
            <div
              className="font-serif italic leading-tight"
              style={{
                color: "rgba(235,215,170,0.9)",
                textShadow: "0 0 20px rgba(212,160,23,0.3), 1px 1px 0 rgba(0,0,0,0.8)",
                fontSize: "17px",
                letterSpacing: "0.01em",
              }}
            >
              Your Story.
            </div>
            <div
              className="font-serif italic leading-tight"
              style={{
                color: "rgba(235,215,170,0.9)",
                textShadow: "0 0 20px rgba(212,160,23,0.3), 1px 1px 0 rgba(0,0,0,0.8)",
                fontSize: "17px",
                letterSpacing: "0.01em",
              }}
            >
              Your Legacy.
            </div>
            <p
              className="font-sans mt-2 text-center leading-tight"
              style={{ color: "rgba(180,140,80,0.55)", fontSize: "8.5px", letterSpacing: "0.06em" }}
            >
              Reflect on your past.
              <br />Share your experiences.
              <br />Inspire future generations.
            </p>
          </div>
        </div>

        {/* Right two nav columns */}
        {MENU_BOARD_SECTIONS.slice(2, 4).map((section) => (
          <div key={section.column} className="p-3" style={{ borderLeft: "1px solid rgba(212,160,23,0.08)" }}>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-amber-950/30"
                  >
                    <div
                      className="text-[11px] font-sans font-semibold uppercase tracking-[0.18em] group-hover:text-amber-300 transition-colors"
                      style={{
                        color: "rgba(235,215,170,0.82)",
                        textShadow: "1px 1px 0 rgba(0,0,0,0.8), 0 0 6px rgba(245,234,216,0.06)",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-[9.5px] font-sans mt-0.5 leading-tight"
                      style={{ color: "rgba(180,140,80,0.55)" }}
                    >
                      {item.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <div
        className="relative z-10 py-2 text-center border-t"
        style={{ borderColor: "rgba(212,160,23,0.1)", background: "rgba(0,0,0,0.2)" }}
      >
        <span
          className="font-serif italic text-[11px]"
          style={{
            color: "rgba(212,160,23,0.45)",
            textShadow: "0 0 15px rgba(212,160,23,0.2)",
          }}
        >
          Stories Connect Generations
        </span>
      </div>
    </div>
  );
}
