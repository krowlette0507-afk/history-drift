"use client";

import Link from "next/link";
import { MENU_BOARD_SECTIONS } from "@/data/interviewers";

export default function MenuBoard() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0f0a04 0%, #1c1208 40%, #150e06 100%)",
        border: "2px solid rgba(101, 67, 20, 0.5)",
        boxShadow: "0 0 0 1px rgba(212,160,23,0.08), inset 0 1px 0 rgba(212,160,23,0.15), 0 20px 60px rgba(0,0,0,0.7)",
      }}>

      {/* Board header */}
      <div className="text-center py-4 border-b border-amber-900/40"
        style={{ background: "linear-gradient(90deg, transparent, rgba(101,67,20,0.3), transparent)" }}>
        <p className="text-amber-600/70 uppercase tracking-[0.3em] text-xs font-serif">
          Capture &bull; Preserve &bull; Share Your Legacy
        </p>
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-4 gap-0">
        {MENU_BOARD_SECTIONS.map((section, idx) => (
          <div
            key={section.column}
            className="p-4"
            style={{ borderRight: idx < MENU_BOARD_SECTIONS.length - 1 ? "1px solid rgba(101,67,20,0.3)" : "none" }}
          >
            <h3 className="text-amber-600/60 uppercase tracking-[0.2em] text-[10px] font-serif mb-3 border-b border-amber-900/30 pb-2">
              {section.column.replace(/-/g, " ")}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}
                    className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-amber-950/40 transition-colors">
                    <div>
                      <div className="text-amber-200 text-xs font-serif font-semibold uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-amber-800/80 text-[10px] leading-tight mt-0.5 font-sans">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <div className="border-t border-amber-900/30 py-3 flex items-center justify-center gap-1"
        style={{ background: "rgba(10,6,2,0.5)" }}>
        <span className="text-amber-600/50 text-[10px] font-serif italic">
          Stories Connect Generations
        </span>
      </div>
    </div>
  );
}
