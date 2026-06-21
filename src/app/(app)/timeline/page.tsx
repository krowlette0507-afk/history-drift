"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllTimelineEvents, DerivedTimelineEvent } from "@/lib/storage";
import { Calendar, Clock, Mic } from "lucide-react";

const PHASE_COLORS: Record<string, string> = {
  hook: "#d4862a", character: "#8a5c8a", journey: "#2a7a8a",
  people: "#c84a4a", places: "#3a8a4a", adventures: "#c8822a",
  challenges: "#5a5a8a", wisdom: "#8a7a2a", legacy: "#2a6a5a",
};

function groupEventsByDecade(events: DerivedTimelineEvent[]) {
  const groups: Record<string, DerivedTimelineEvent[]> = {};
  for (const e of events) {
    const key = e.year
      ? `${Math.floor(e.year / 10) * 10}s`
      : e.period || "Undated";
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return groups;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<DerivedTimelineEvent[]>([]);

  useEffect(() => { setEvents(getAllTimelineEvents()); }, []);

  if (events.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <Calendar size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Timeline</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-sm mb-6">
          As you share your story, key dates and life events will appear here on your personal timeline.
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

  const groups = groupEventsByDecade(events);
  const groupKeys = Object.keys(groups);

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="mb-8">
        <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Life</div>
        <h1 className="text-amber-200 font-serif font-bold text-3xl">Timeline</h1>
        <p className="text-amber-700/50 font-sans text-sm mt-1">{events.length} events extracted from your interviews</p>
      </div>

      <div className="relative max-w-2xl">
        {/* Vertical line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-700/30 via-amber-800/20 to-transparent" />

        <div className="space-y-8">
          {groupKeys.map((decade) => (
            <div key={decade}>
              {/* Decade marker */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-[58px] text-right flex-shrink-0">
                  <span className="text-xs font-sans font-bold text-amber-600/60 uppercase tracking-wider">{decade}</span>
                </div>
                <div className="w-7 h-7 rounded-full border-2 border-amber-700/40 flex items-center justify-center flex-shrink-0 z-10"
                  style={{ background: "rgba(15,10,4,1)" }}>
                  <Clock size={10} className="text-amber-600/50" />
                </div>
              </div>

              {/* Events in decade */}
              <div className="space-y-3">
                {groups[decade].map((event, i) => {
                  const color = PHASE_COLORS[event.phase] || "#8a5021";
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-[58px] text-right flex-shrink-0 pt-2">
                        {event.year && (
                          <span className="text-[10px] font-sans text-amber-700/50">{event.year}</span>
                        )}
                      </div>
                      <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0 z-10"
                        style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
                      <div className="flex-1 rounded-xl px-4 py-3 border"
                        style={{ background: "rgba(18,11,4,0.7)", borderColor: `${color}25` }}>
                        <p className="text-sm font-serif text-amber-300/85 leading-relaxed">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-sans px-2 py-0.5 rounded-full"
                            style={{ background: `${color}15`, color: `${color}99` }}>
                            {event.phase}
                          </span>
                          {event.period && !event.year && (
                            <span className="text-[9px] font-sans text-amber-800/40">{event.period}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
