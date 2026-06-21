"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPlaces, DerivedPlace } from "@/lib/storage";
import { MapPin, Mic } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  "childhood home": "#c84a4a", "home": "#c84a4a", "house": "#c84a4a",
  "school": "#2a7a8a", "university": "#2a7a8a", "college": "#2a7a8a",
  "workplace": "#8a7a2a", "office": "#8a7a2a", "job": "#8a7a2a",
  "travel": "#3a8a4a", "vacation": "#3a8a4a", "destination": "#3a8a4a",
  "city": "#5a5a8a", "town": "#5a5a8a", "neighborhood": "#5a5a8a",
  "military": "#6a4a8a",
};

function getTypeColor(type: string): string {
  const lower = type.toLowerCase();
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (lower.includes(k)) return v;
  }
  return "#7a5a28";
}

const TYPE_ICONS: Record<string, string> = {
  "childhood home": "🏠", "home": "🏠", "house": "🏠",
  "school": "🎓", "university": "🎓", "college": "🎓",
  "workplace": "💼", "office": "💼",
  "travel": "✈️", "vacation": "✈️", "destination": "🌍",
  "city": "🏙️", "town": "🌆", "neighborhood": "🏘️",
  "military": "🎖️",
};

function getTypeIcon(type: string): string {
  const lower = type.toLowerCase();
  for (const [k, v] of Object.entries(TYPE_ICONS)) {
    if (lower.includes(k)) return v;
  }
  return "📍";
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<DerivedPlace[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => { setPlaces(getAllPlaces()); }, []);

  if (places.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <MapPin size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Places</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-sm mb-6">
          Your homes, schools, workplaces, and travels will appear here as you share your story.
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

  const filtered = places.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.type.toLowerCase().includes(filter.toLowerCase())
  );

  // Group by type
  const groups: Record<string, DerivedPlace[]> = {};
  for (const p of filtered) {
    const t = p.type || "Other";
    if (!groups[t]) groups[t] = [];
    groups[t].push(p);
  }

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="mb-8">
        <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Story</div>
        <h1 className="text-amber-200 font-serif font-bold text-3xl">Places</h1>
        <p className="text-amber-700/50 font-sans text-sm mt-1">{places.length} places from your interviews</p>
      </div>

      <div className="mb-5">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search places…"
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm font-sans text-amber-200 placeholder-amber-900/40 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.35)" }}
        />
      </div>

      <div className="space-y-6 max-w-3xl">
        {Object.entries(groups).map(([type, ps]) => {
          const color = getTypeColor(type);
          const icon = getTypeIcon(type);
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{icon}</span>
                <h2 className="text-sm font-sans font-semibold" style={{ color }}>{type}</h2>
                <span className="text-[9px] font-sans text-amber-800/40">({ps.length})</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {ps.map((p, i) => (
                  <div key={i} className="rounded-xl p-3.5 border"
                    style={{ background: "rgba(18,11,4,0.7)", borderColor: `${color}25` }}>
                    <div className="text-sm font-serif text-amber-200 font-semibold leading-tight">{p.name}</div>
                    <div className="text-[9px] font-sans text-amber-800/50 mt-1">{p.type}</div>
                    {p.mentions > 1 && (
                      <div className="mt-2">
                        <span className="text-[9px] font-sans px-1.5 py-0.5 rounded-full"
                          style={{ background: `${color}15`, color: `${color}80` }}>
                          {p.mentions}× mentioned
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
