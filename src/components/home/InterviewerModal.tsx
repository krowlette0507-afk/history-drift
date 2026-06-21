"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Mic, BookOpen, MessageCircle } from "lucide-react";
import { Interviewer } from "@/data/interviewers";
import InterviewerPortrait from "./InterviewerPortrait";

interface Props {
  interviewer: Interviewer;
  onClose: () => void;
}

export default function InterviewerModal({ interviewer, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,3,1,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #1e1208 0%, #160e06 50%, #1a1208 100%)",
          border: "1px solid rgba(212,160,23,0.3)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,160,23,0.08), inset 0 1px 0 rgba(212,160,23,0.15)",
          animation: "modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-amber-700 hover:text-amber-300 hover:bg-amber-900/30 transition-all"
        >
          <X size={16} />
        </button>

        {/* Decorative top bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.6), transparent)" }} />

        <div className="flex gap-0">
          {/* Portrait column */}
          <div
            className="w-56 flex-shrink-0 relative flex flex-col items-center pt-8 pb-6 px-4"
            style={{ background: "linear-gradient(160deg, rgba(44,26,8,0.5) 0%, rgba(10,6,2,0.3) 100%)" }}
          >
            {/* Portrait glow */}
            <div
              className="absolute inset-0 opacity-30"
              style={{ background: `radial-gradient(ellipse at 50% 40%, ${interviewer.accentColor}60, transparent 70%)` }}
            />

            <div className="relative rounded-xl overflow-hidden w-36 shadow-2xl"
              style={{ border: `2px solid ${interviewer.accentColor}60` }}>
              <InterviewerPortrait interviewer={interviewer} size={144} />
            </div>

            <div className="mt-4 text-center relative z-10">
              <div
                className="text-xs font-sans uppercase tracking-widest mb-1"
                style={{ color: `${interviewer.accentColor}cc` }}
              >
                Age {interviewer.age}
              </div>
              <h2 className="text-amber-100 font-serif font-bold text-base leading-tight">
                {interviewer.name}
              </h2>
              <p className="text-amber-700/70 text-xs font-sans mt-1 leading-tight">
                {interviewer.title}
              </p>
            </div>

            {/* Quote */}
            <div className="mt-5 relative z-10 text-center">
              <p className="text-amber-600/60 font-serif italic text-[11px] leading-relaxed">
                &ldquo;{interviewer.quote}&rdquo;
              </p>
            </div>

            {/* Style tags */}
            <div className="mt-4 flex flex-wrap gap-1 justify-center relative z-10">
              {interviewer.style.map((s) => (
                <span
                  key={s}
                  className="text-[9px] px-2 py-0.5 rounded-full font-sans uppercase tracking-wider"
                  style={{
                    background: `${interviewer.accentColor}25`,
                    color: `${interviewer.accentColor}cc`,
                    border: `1px solid ${interviewer.accentColor}40`,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Details column */}
          <div className="flex-1 p-6 flex flex-col">
            {/* Expertise */}
            <div className="mb-5">
              <div className="text-amber-600/60 uppercase tracking-[0.25em] text-[10px] font-serif mb-2">Expertise</div>
              <div className="flex flex-wrap gap-1.5">
                {interviewer.expertise.map((e) => (
                  <span key={e} className="text-xs px-2.5 py-1 rounded-lg font-sans text-amber-300/80 bg-amber-900/25 border border-amber-800/30">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Focus areas */}
            <div className="mb-5">
              <div className="text-amber-600/60 uppercase tracking-[0.25em] text-[10px] font-serif mb-2">Focus Areas</div>
              <div className="space-y-1">
                {interviewer.focusAreas.map((area) => (
                  <div key={area} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-700/60 flex-shrink-0" />
                    <span className="text-amber-400/80 text-xs font-sans">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best for */}
            <div className="mb-5">
              <div className="text-amber-600/60 uppercase tracking-[0.25em] text-[10px] font-serif mb-2">Best For</div>
              <p className="text-amber-300/70 text-xs font-sans leading-relaxed">{interviewer.bestFor}</p>
            </div>

            {/* Opening question */}
            <div
              className="flex-1 rounded-xl p-4 mb-5"
              style={{ background: "rgba(44,26,8,0.5)", border: "1px solid rgba(212,160,23,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={12} className="text-amber-600/60" />
                <div className="text-amber-600/60 uppercase tracking-[0.25em] text-[10px] font-serif">
                  Sample Opening Question
                </div>
              </div>
              <p className="text-amber-200/80 font-serif italic text-sm leading-relaxed">
                &ldquo;{interviewer.openingQuestion}&rdquo;
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <Link
                href={`/interview?interviewer=${interviewer.id}`}
                className="flex items-center justify-center gap-3 rounded-xl py-3 px-5 font-serif font-semibold text-sm text-amber-50 transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${interviewer.accentColor}, #c8843a)`,
                  boxShadow: `0 4px 20px ${interviewer.accentColor}50`,
                }}
                onClick={onClose}
              >
                <Mic size={16} />
                Start Interview With {interviewer.name.split(" ")[0]}
              </Link>
              <Link
                href={`/interview?interviewer=${interviewer.id}&mode=text`}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 px-5 font-serif text-sm text-amber-500/70 border border-amber-800/30 hover:bg-amber-900/20 hover:text-amber-400 transition-all"
                onClick={onClose}
              >
                <BookOpen size={14} />
                Prefer to type? Use text mode
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)" }} />
      </div>
    </div>
  );
}
