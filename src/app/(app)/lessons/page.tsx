"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllLessons, getAllQuotes, DerivedLesson } from "@/lib/storage";
import { Lightbulb, Quote, Mic } from "lucide-react";

const PHASE_LABELS: Record<string, string> = {
  hook: "Opening Story", character: "Character", journey: "Life Journey",
  people: "People", places: "Places", adventures: "Adventures",
  challenges: "Challenges", wisdom: "Wisdom", legacy: "Legacy",
};

const PHASE_COLORS: Record<string, string> = {
  hook: "#d4862a", character: "#8a5c8a", journey: "#2a7a8a",
  people: "#c84a4a", places: "#3a8a4a", adventures: "#c8822a",
  challenges: "#5a5a8a", wisdom: "#8a7a2a", legacy: "#2a6a5a",
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState<DerivedLesson[]>([]);
  const [quotes, setQuotes] = useState<{ quote: string; phase: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"lessons" | "quotes">("lessons");

  useEffect(() => {
    setLessons(getAllLessons());
    setQuotes(getAllQuotes());
  }, []);

  const hasContent = lessons.length > 0 || quotes.length > 0;

  if (!hasContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <Lightbulb size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Life Lessons</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-sm mb-6">
          Your wisdom, lessons, and memorable quotes will be extracted from your interviews and collected here.
        </p>
        <Link href="/interview"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif text-amber-100 transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
          <Mic size={15} />
          Start Interview
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="mb-8">
        <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Wisdom</div>
        <h1 className="text-amber-200 font-serif font-bold text-3xl">Life Lessons</h1>
        <p className="text-amber-700/50 font-sans text-sm mt-1">
          {lessons.length} lessons · {quotes.length} quotes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "rgba(15,10,4,0.7)", border: "1px solid rgba(90,52,20,0.25)" }}>
        {([["lessons", "Life Lessons", <Lightbulb key="l" size={13} />], ["quotes", "Memorable Quotes", <Quote key="q" size={13} />]] as const).map(([tab, label, icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab as "lessons" | "quotes")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans font-semibold transition-all"
            style={{
              background: activeTab === tab ? "rgba(120,70,18,0.5)" : "transparent",
              color: activeTab === tab ? "rgba(240,200,120,0.9)" : "rgba(140,90,30,0.6)",
            }}>
            {icon}{label}
          </button>
        ))}
      </div>

      {activeTab === "lessons" && (
        <div className="max-w-2xl space-y-3">
          {lessons.map((l, i) => {
            const color = PHASE_COLORS[l.phase] || "#8a5021";
            return (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border"
                style={{ background: "rgba(18,11,4,0.7)", borderColor: `${color}25` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Lightbulb size={14} style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-serif italic text-amber-300/85 leading-relaxed">{l.lesson}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-sans px-2 py-0.5 rounded-full"
                      style={{ background: `${color}15`, color: `${color}99` }}>
                      {PHASE_LABELS[l.phase] || l.phase}
                    </span>
                    <span className="text-[9px] font-sans text-amber-800/35">
                      {new Date(l.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "quotes" && (
        <div className="max-w-2xl space-y-4">
          {quotes.map((q, i) => {
            const color = PHASE_COLORS[q.phase] || "#8a5021";
            return (
              <div key={i} className="p-5 rounded-2xl border relative"
                style={{ background: "rgba(18,11,4,0.7)", borderColor: `${color}25` }}>
                <Quote size={20} className="absolute top-4 left-4 opacity-15" style={{ color }} />
                <p className="text-base font-serif italic text-amber-200/90 leading-relaxed pl-6">
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="mt-3 pl-6">
                  <span className="text-[9px] font-sans px-2 py-0.5 rounded-full"
                    style={{ background: `${color}15`, color: `${color}99` }}>
                    {PHASE_LABELS[q.phase] || q.phase}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
