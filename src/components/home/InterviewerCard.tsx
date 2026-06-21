"use client";

import { Interviewer } from "@/data/interviewers";
import { cn } from "@/lib/cn";

interface InterviewerCardProps {
  interviewer: Interviewer;
  selected: boolean;
  onSelect: () => void;
}

const AVATAR_INITIALS: Record<string, string> = {
  dr_james_carter: "JC",
  professor_mei_lin: "ML",
  sarah_bennett: "SB",
  miguel_alvarez: "MA",
  jordan_brooks: "JB",
};

// Each interviewer gets a distinct warm portrait style via CSS
const PORTRAIT_STYLES: Record<string, React.CSSProperties> = {
  dr_james_carter: { background: "linear-gradient(160deg, #3d2008 20%, #5a3010 60%, #2a1505 100%)" },
  professor_mei_lin: { background: "linear-gradient(160deg, #2a1e0a 20%, #4a3418 60%, #1e1506 100%)" },
  sarah_bennett:    { background: "linear-gradient(160deg, #2e1a0c 20%, #4e2e18 60%, #221208 100%)" },
  miguel_alvarez:   { background: "linear-gradient(160deg, #351e08 20%, #5a3412 60%, #281508 100%)" },
  jordan_brooks:    { background: "linear-gradient(160deg, #1e1a0e 20%, #3e3018 60%, #161208 100%)" },
};

export default function InterviewerCard({ interviewer, selected, onSelect }: InterviewerCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex flex-col items-center gap-0 cursor-pointer transition-all duration-300 focus:outline-none",
        selected ? "scale-105" : "hover:scale-102"
      )}
    >
      {/* Portrait area */}
      <div className={cn(
        "relative w-full aspect-[3/4] rounded-t-2xl overflow-hidden transition-all duration-300",
        "border-2",
        selected
          ? "border-amber-500/80 shadow-[0_0_30px_rgba(212,160,23,0.4)]"
          : "border-amber-900/30 group-hover:border-amber-700/50"
      )}>
        {/* Background portrait simulation */}
        <div className="absolute inset-0" style={PORTRAIT_STYLES[interviewer.id]} />

        {/* Silhouette / initial avatar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif font-bold border-2 mb-3",
            selected
              ? "bg-amber-700/60 border-amber-400/60 text-amber-100"
              : "bg-amber-900/40 border-amber-800/40 text-amber-400 group-hover:bg-amber-800/50"
          )}>
            {AVATAR_INITIALS[interviewer.id]}
          </div>
          {/* Subtle silhouette bars suggesting a person */}
          <div className="w-20 h-0.5 bg-amber-800/20 rounded mb-1" />
          <div className="w-16 h-0.5 bg-amber-800/15 rounded mb-1" />
          <div className="w-12 h-0.5 bg-amber-800/10 rounded" />
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-950 to-transparent" />

        {/* Selected glow overlay */}
        {selected && (
          <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
        )}

        {/* Age badge */}
        <div className={cn(
          "absolute top-2 right-2 text-[10px] font-serif px-1.5 py-0.5 rounded",
          selected ? "bg-amber-700/80 text-amber-100" : "bg-stone-900/80 text-amber-700"
        )}>
          Age {interviewer.age}
        </div>
      </div>

      {/* Info card */}
      <div className={cn(
        "w-full rounded-b-2xl p-3 transition-all duration-300 border-2 border-t-0",
        selected
          ? "bg-gradient-to-b from-amber-950/80 to-stone-950/90 border-amber-500/80"
          : "bg-gradient-to-b from-stone-900/60 to-stone-950/80 border-amber-900/30 group-hover:border-amber-800/50"
      )}>
        <h3 className={cn(
          "font-serif font-bold text-sm leading-tight transition-colors",
          selected ? "text-amber-200" : "text-amber-400 group-hover:text-amber-300"
        )}>
          {interviewer.name}
        </h3>
        <p className="text-amber-700/80 text-[10px] leading-tight mt-0.5 font-sans">
          {interviewer.title}
        </p>

        {/* Expertise tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {interviewer.style.slice(0, 2).map((s) => (
            <span key={s} className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-sans uppercase tracking-wide",
              selected
                ? "bg-amber-800/50 text-amber-300"
                : "bg-stone-800/60 text-amber-700/80"
            )}>
              {s}
            </span>
          ))}
        </div>

        {/* Quote */}
        <p className={cn(
          "text-[10px] italic mt-2 leading-snug font-serif transition-colors",
          selected ? "text-amber-300/80" : "text-amber-800/60 group-hover:text-amber-700/70"
        )}>
          &ldquo;{interviewer.quote}&rdquo;
        </p>
      </div>
    </button>
  );
}
