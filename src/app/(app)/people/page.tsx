"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPeople, correctPersonName, DerivedPerson } from "@/lib/storage";
import { Users, Mic, Quote, Pencil, Check, X } from "lucide-react";

const RELATIONSHIP_COLORS: Record<string, string> = {
  parent: "#c84a4a", mother: "#c84a4a", father: "#c84a4a",
  sibling: "#8a5c8a", brother: "#8a5c8a", sister: "#8a5c8a",
  spouse: "#d4862a", partner: "#d4862a", husband: "#d4862a", wife: "#d4862a",
  child: "#3a8a4a", son: "#3a8a4a", daughter: "#3a8a4a",
  friend: "#2a7a8a", mentor: "#8a7a2a", teacher: "#8a7a2a",
  grandparent: "#5a5a8a", grandmother: "#5a5a8a", grandfather: "#5a5a8a",
};

function getColor(relationship: string): string {
  const key = relationship.toLowerCase().trim();
  for (const [k, v] of Object.entries(RELATIONSHIP_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#7a5a28";
}

function PersonCard({ person, onCorrected }: { person: DerivedPerson; onCorrected: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [editRel, setEditRel] = useState(person.relationship);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const color = getColor(person.relationship);
  const initials = person.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    const count = await correctPersonName(person.name, editName.trim(), editRel.trim() || person.relationship);
    setSaving(false);
    setEditing(false);
    setSavedMsg(`Updated across ${count} exchange${count !== 1 ? "s" : ""}`);
    setTimeout(() => { setSavedMsg(""); onCorrected(); }, 1800);
  }

  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: "rgba(18,11,4,0.7)", borderColor: open ? `${color}40` : "rgba(90,52,20,0.2)" }}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => { if (!editing) setOpen(!open); }}>
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm text-amber-100"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-serif text-amber-200 font-semibold truncate">{person.name}</div>
            <div className="text-[10px] font-sans text-amber-800/50 mt-0.5">{person.relationship}</div>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {savedMsg ? (
            <span className="text-[9px] font-sans text-green-400/80">{savedMsg}</span>
          ) : (
            <span className="text-[9px] font-sans px-2 py-1 rounded-full"
              style={{ background: `${color}15`, color: `${color}99`, border: `1px solid ${color}30` }}>
              {person.mentions} mention{person.mentions !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={() => { setEditing(!editing); setOpen(false); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
            style={{ background: editing ? "rgba(122,45,138,0.3)" : "rgba(40,24,8,0.6)", color: editing ? "#d070e0" : "rgba(220,175,80,0.92)" }}>
            <Pencil size={11} />
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: "rgba(80,50,15,0.25)" }}>
          <p className="text-[10px] font-sans pt-3" style={{ color: "rgba(225,185,80,0.92)" }}>
            Correct the name or relationship — this will update all interviews that mention this person.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider mb-1" style={{ color: "rgba(160,110,50,0.55)" }}>Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm font-sans focus:outline-none"
                style={{ background: "rgba(10,6,2,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider mb-1" style={{ color: "rgba(160,110,50,0.55)" }}>Relationship</label>
              <input value={editRel} onChange={(e) => setEditRel(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm font-sans focus:outline-none"
                style={{ background: "rgba(10,6,2,0.9)", border: "1px solid rgba(100,65,20,0.35)", color: "#e8d4a0" }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !editName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
              <Check size={12} />{saving ? "Saving..." : "Save correction"}
            </button>
            <button onClick={() => { setEditing(false); setEditName(person.name); setEditRel(person.relationship); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans"
              style={{ background: "rgba(40,24,8,0.6)", color: "rgba(220,175,80,0.95)", border: "1px solid rgba(100,65,20,0.25)" }}>
              <X size={12} />Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quotes */}
      {open && !editing && person.quotes.length > 0 && (
        <div className="px-4 pb-4 border-t border-amber-900/15 pt-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Quote size={10} className="text-amber-700/40" />
            <span className="text-[9px] font-sans text-amber-800/40 uppercase tracking-wider">What you said about {person.name.split(" ")[0]}</span>
          </div>
          {person.quotes.slice(0, 3).map((q, i) => (
            <p key={i} className="text-xs font-serif italic text-amber-400/70 leading-relaxed pl-3 border-l-2"
              style={{ borderColor: `${color}40` }}>
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PeoplePage() {
  const [people, setPeople] = useState<DerivedPerson[]>([]);
  const [filter, setFilter] = useState("");

  function reload() { setPeople(getAllPeople()); }
  useEffect(() => { reload(); }, []);

  const filtered = people.filter((p) =>
    !filter || p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.relationship.toLowerCase().includes(filter.toLowerCase())
  );

  if (people.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <Users size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">People Who Mattered</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-sm mb-6">
          As you share your story, the people you mention — family, friends, mentors, and more — will appear here.
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Story</div>
          <h1 className="text-amber-200 font-serif font-bold text-3xl">People Who Mattered</h1>
          <p className="text-amber-700/50 font-sans text-sm mt-1">
            {people.length} people extracted from your interviews · tap <Pencil size={11} className="inline" /> to correct any name
          </p>
        </div>
      </div>

      <div className="mb-5">
        <input value={filter} onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name or relationship..."
          className="w-full max-w-sm rounded-xl px-4 py-2.5 text-sm font-sans text-amber-200 placeholder-amber-900/40 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
          style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.35)" }} />
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-3xl">
        {filtered.map((p, i) => <PersonCard key={i} person={p} onCorrected={reload} />)}
      </div>

      {filtered.length === 0 && filter && (
        <p className="text-amber-800/50 font-serif italic text-sm mt-8">No people matching &ldquo;{filter}&rdquo;</p>
      )}
    </div>
  );
}
