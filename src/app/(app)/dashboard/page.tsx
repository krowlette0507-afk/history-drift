"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { INTERVIEWERS } from "@/data/interviewers";
import {
  getSessions, getStats, getAllPeople, getAllPlaces, getAllLessons,
  getAllQuotes, StoredSession
} from "@/lib/storage";
import {
  Mic, Clock, Users, MapPin, Lightbulb, BookOpen, Quote,
  ChevronRight, Sparkles, Calendar, PlayCircle
} from "lucide-react";

function StatCard({ icon, value, label, color }: {
  icon: React.ReactNode; value: number | string; label: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: "rgba(18,11,4,0.7)", border: `1px solid ${color}25` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-serif font-bold text-amber-200 leading-none">{value}</div>
        <div className="text-xs font-sans text-amber-800/60 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: StoredSession }) {
  const iv = INTERVIEWERS.find((i) => i.id === session.interviewerId) || INTERVIEWERS[0];
  const date = new Date(session.startedAt);
  const isComplete = !!session.completedAt;

  return (
    <Link href={`/interview?interviewer=${session.interviewerId}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01]"
      style={{ background: "rgba(18,11,4,0.7)", borderColor: isComplete ? "rgba(90,52,20,0.3)" : `${iv.accentColor}30` }}>
      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm text-amber-100"
        style={{ background: `linear-gradient(135deg, ${iv.accentColor}, #c8843a)` }}>
        {iv.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-serif text-amber-200 font-semibold truncate">
          {session.title || `Session with ${iv.name.split(" ")[0]}`}
        </div>
        <div className="text-xs font-sans text-amber-800/50 mt-0.5">
          {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {" · "}{session.exchangeCount} exchange{session.exchangeCount !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-[9px] font-sans px-2 py-1 rounded-full border ${isComplete
          ? "bg-green-900/30 text-green-500/70 border-green-800/30"
          : ""}`}
          style={!isComplete ? { background: `${iv.accentColor}15`, color: `${iv.accentColor}bb`, borderColor: `${iv.accentColor}30` } : {}}>
          {isComplete ? "Complete" : "In Progress"}
        </span>
        <ChevronRight size={14} className="text-amber-800/40 group-hover:text-amber-600/60 transition-colors" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    sessionCount: 0, exchangeCount: 0, wordCount: 0,
    peopleCount: 0, placesCount: 0, lessonsCount: 0,
    eventsCount: 0, quotesCount: 0, completedSessions: 0
  });
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [recentPeople, setRecentPeople] = useState<{ name: string; relationship: string; mentions: number }[]>([]);
  const [recentPlaces, setRecentPlaces] = useState<{ name: string; type: string; mentions: number }[]>([]);
  const [recentLessons, setRecentLessons] = useState<{ lesson: string }[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<{ quote: string }[]>([]);

  useEffect(() => {
    setStats(getStats());
    setSessions(getSessions().slice(0, 5));
    setRecentPeople(getAllPeople().slice(0, 4));
    setRecentPlaces(getAllPlaces().slice(0, 4));
    setRecentLessons(getAllLessons().slice(0, 3));
    setRecentQuotes(getAllQuotes().slice(0, 2));
  }, []);

  const hasContent = stats.exchangeCount > 0;

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Welcome back</div>
          <h1 className="text-amber-200 font-serif font-bold text-3xl">Your Story</h1>
          <p className="text-amber-700/50 font-serif italic text-sm mt-1">
            {hasContent
              ? `${stats.wordCount.toLocaleString()} words captured · ${stats.sessionCount} session${stats.sessionCount !== 1 ? "s" : ""}`
              : "Your life story begins with a single conversation."}
          </p>
        </div>
        <Link href="/interview"
          className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-serif font-semibold text-sm text-amber-50 transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #6a3a12, #c8843a)", boxShadow: "0 4px 20px rgba(120,70,18,0.35)" }}>
          <Mic size={16} />
          New Interview
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Mic size={18} />} value={stats.sessionCount} label="Interview Sessions" color="#c8843a" />
        <StatCard icon={<Users size={18} />} value={stats.peopleCount} label="People Captured" color="#c84a4a" />
        <StatCard icon={<MapPin size={18} />} value={stats.placesCount} label="Places Remembered" color="#3a8a4a" />
        <StatCard icon={<Lightbulb size={18} />} value={stats.lessonsCount} label="Life Lessons" color="#8a7a2a" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">

          {/* Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-amber-300/80 font-serif font-semibold text-lg">Interview Sessions</h2>
              <Link href="/interview" className="text-amber-700/60 hover:text-amber-500 text-xs font-sans flex items-center gap-1 transition-colors">
                Start new <ChevronRight size={12} />
              </Link>
            </div>
            {sessions.length === 0 ? (
              <div className="rounded-2xl p-8 text-center border border-dashed border-amber-900/30">
                <Mic size={32} className="text-amber-800/30 mx-auto mb-3" />
                <p className="text-amber-700/50 font-serif italic text-sm mb-4">
                  No interviews yet. Your story is waiting to be told.
                </p>
                <Link href="/interview"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-serif text-amber-200 transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
                  <PlayCircle size={16} />
                  Begin Your First Interview
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div>
            <h2 className="text-amber-300/80 font-serif font-semibold text-lg mb-4">Explore Your Story</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: "/timeline", icon: <Calendar size={16} />, label: "Timeline", desc: `${stats.eventsCount} events`, color: "#2a7a8a" },
                { href: "/people", icon: <Users size={16} />, label: "People", desc: `${stats.peopleCount} captured`, color: "#c84a4a" },
                { href: "/places", icon: <MapPin size={16} />, label: "Places", desc: `${stats.placesCount} places`, color: "#3a8a4a" },
                { href: "/biography", icon: <BookOpen size={16} />, label: "Biography", desc: "Generate story", color: "#7a4a20" },
                { href: "/lessons", icon: <Lightbulb size={16} />, label: "Life Lessons", desc: `${stats.lessonsCount} lessons`, color: "#8a7a2a" },
                { href: "/ask", icon: <Sparkles size={16} />, label: "Ask Me Anything", desc: "Q&A from your story", color: "#5a5a8a" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="group flex items-start gap-3 p-4 rounded-2xl border border-amber-900/20 transition-all hover:border-amber-800/40 hover:scale-[1.02]"
                  style={{ background: "rgba(18,11,4,0.7)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}18`, border: `1px solid ${item.color}30`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-serif text-amber-300/80 font-semibold group-hover:text-amber-200 transition-colors">{item.label}</div>
                    <div className="text-[10px] font-sans text-amber-800/50 mt-0.5">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {recentPeople.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-red-500/60" />
                  <span className="text-[10px] uppercase tracking-widest font-sans text-amber-700/50">People</span>
                </div>
                <Link href="/people" className="text-[9px] font-sans text-amber-800/40 hover:text-amber-600 transition-colors">See all</Link>
              </div>
              {recentPeople.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-amber-900/15 last:border-0">
                  <div>
                    <div className="text-xs font-serif text-amber-300/80">{p.name}</div>
                    <div className="text-[9px] font-sans text-amber-800/50">{p.relationship}</div>
                  </div>
                  <span className="text-[9px] font-sans text-amber-800/40">{p.mentions}×</span>
                </div>
              ))}
            </div>
          )}

          {recentPlaces.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-green-500/60" />
                  <span className="text-[10px] uppercase tracking-widest font-sans text-amber-700/50">Places</span>
                </div>
                <Link href="/places" className="text-[9px] font-sans text-amber-800/40 hover:text-amber-600 transition-colors">See all</Link>
              </div>
              {recentPlaces.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-amber-900/15 last:border-0">
                  <div>
                    <div className="text-xs font-serif text-amber-300/80">{p.name}</div>
                    <div className="text-[9px] font-sans text-amber-800/50">{p.type}</div>
                  </div>
                  <span className="text-[9px] font-sans text-amber-800/40">{p.mentions}×</span>
                </div>
              ))}
            </div>
          )}

          {recentLessons.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={12} className="text-yellow-600/60" />
                <span className="text-[10px] uppercase tracking-widest font-sans text-amber-700/50">Life Lessons</span>
              </div>
              {recentLessons.map((l, i) => (
                <p key={i} className="text-[11px] font-serif italic text-amber-400/70 py-1.5 border-b border-amber-900/15 last:border-0">
                  · {l.lesson}
                </p>
              ))}
            </div>
          )}

          {recentQuotes.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Quote size={12} className="text-amber-600/60" />
                <span className="text-[10px] uppercase tracking-widest font-sans text-amber-700/50">Memorable Quotes</span>
              </div>
              {recentQuotes.map((q, i) => (
                <p key={i} className="text-[11px] font-serif italic text-amber-300/70 py-1.5 border-b border-amber-900/15 last:border-0">
                  &ldquo;{q.quote}&rdquo;
                </p>
              ))}
            </div>
          )}

          {!hasContent && (
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <Clock size={24} className="text-amber-700/30 mx-auto mb-3" />
              <p className="text-amber-700/50 font-serif italic text-xs leading-relaxed">
                Complete your first interview to see memories, people, places, and lessons extracted automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
