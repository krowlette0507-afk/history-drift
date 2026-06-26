"use client";

import {
  useState, useEffect, useRef, useCallback, Suspense, useMemo
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { INTERVIEWERS, Interviewer } from "@/data/interviewers";
import { INTERVIEW_PHASES, PhaseId } from "@/lib/interview-config";
import {
  createSession, saveExchange, updateExchange, updateSession,
  getExchanges, getSessions, StoredExchange, StoredMemory
} from "@/lib/storage";
import InterviewerPortrait from "@/components/home/InterviewerPortrait";
import {
  Mic, MicOff, Square, Pause, Play, Volume2, VolumeX,
  Send, Edit3, Check, X, ChevronRight, ChevronDown,
  Sparkles, BookOpen, Clock, ArrowLeft, RotateCcw,
  Users, MapPin, Lightbulb, Quote, Calendar, Loader2,
  CheckCircle, Circle
} from "lucide-react";

/* ─── Phase config ────────────────────────────────────────────────────── */
const PHASE_QUESTIONS_PER: Record<PhaseId, number> = {
  hook: 3, character: 4, journey: 6, people: 5,
  places: 4, adventures: 4, challenges: 4, wisdom: 4, legacy: 3,
};

const PHASE_COLORS: Record<PhaseId, string> = {
  hook: "#d4862a", character: "#8a5c8a", journey: "#2a7a8a",
  people: "#c84a4a", places: "#3a8a4a", adventures: "#c8822a",
  challenges: "#5a5a8a", wisdom: "#8a7a2a", legacy: "#2a6a5a",
};

const PHASE_ICONS: Record<PhaseId, React.ReactNode> = {
  hook: <Sparkles size={12} />,
  character: <Users size={12} />,
  journey: <Clock size={12} />,
  people: <Users size={12} />,
  places: <MapPin size={12} />,
  adventures: <BookOpen size={12} />,
  challenges: <ChevronRight size={12} />,
  wisdom: <Lightbulb size={12} />,
  legacy: <BookOpen size={12} />,
};

const OPENING_QUESTIONS: Record<string, Record<PhaseId, string>> = {
  dr_james_carter: {
    hook: "Before we begin, I'd love to know who I'm speaking with. Please share your name and tell me a little about yourself — where you're from, what stage of life you're in, whatever feels right. There's no wrong way to start.",
    character: "", journey: "", people: "", places: "", adventures: "", challenges: "", wisdom: "", legacy: "",
  },
  professor_mei_lin: {
    hook: "I'm so glad you're here. Before we dive in, I'd love to know your name and a little about who you are — your background, where you grew up, whatever comes to mind first. Let's start simply.",
    character: "", journey: "", people: "", places: "", adventures: "", challenges: "", wisdom: "", legacy: "",
  },
  sarah_bennett: {
    hook: "Welcome — I'm really glad you're here. Let's start by getting to know each other a little. What's your name, and can you give me a quick sense of who you are and where you're at in life right now?",
    character: "", journey: "", people: "", places: "", adventures: "", challenges: "", wisdom: "", legacy: "",
  },
  miguel_alvarez: {
    hook: "Hey, really glad you're here. Before anything else — what's your name, and tell me a little about yourself. Where you're from, what your world looks like right now. Just talk to me.",
    character: "", journey: "", people: "", places: "", adventures: "", challenges: "", wisdom: "", legacy: "",
  },
  jordan_brooks: {
    hook: "Okay, let's do this! First things first — what's your name, and give me the quick version of you. Where you're from, what your life looks like, whatever you want me to know going in.",
    character: "", journey: "", people: "", places: "", adventures: "", challenges: "", wisdom: "", legacy: "",
  },
};

/* ─── Types ───────────────────────────────────────────────────────────── */
type RecordingState = "idle" | "recording" | "paused" | "stopped";
type InterviewState = "select" | "ready" | "active" | "summary";

interface LiveMessage {
  role: "assistant" | "user";
  content: string;
}

interface ActiveExchange {
  id: string;
  question: string;
  answer: string;
  phase: PhaseId;
  memory?: StoredMemory;
  extracting?: boolean;
  editing?: boolean;
  editDraft?: string;
}

/* ─── Waveform animation ──────────────────────────────────────────────── */
function WaveBar({ delay, active }: { delay: number; active: boolean }) {
  return (
    <div
      className="rounded-full transition-all"
      style={{
        width: 3,
        height: active ? `${12 + Math.random() * 16}px` : "4px",
        background: active ? "rgba(212,134,42,0.9)" : "rgba(212,134,42,0.3)",
        animationDelay: `${delay}ms`,
        transition: "height 0.12s ease",
      }}
    />
  );
}

const BARS = 16;

function RecordingWave({
  active,
  analyserRef,
}: {
  active: boolean;
  analyserRef?: React.RefObject<AnalyserNode | null>;
}) {
  const [heights, setHeights] = useState<number[]>(Array(BARS).fill(4));
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setHeights(Array(BARS).fill(4));
      return;
    }

    const tick = () => {
      const analyser = analyserRef?.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const binSize = Math.max(1, Math.floor(data.length / BARS));
        setHeights(
          Array.from({ length: BARS }, (_, i) => {
            const slice = data.slice(i * binSize, (i + 1) * binSize);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            return 4 + (avg / 255) * 30; // 4 – 34 px
          })
        );
      } else {
        // Fallback: gentle animation when analyser not ready
        setHeights(Array.from({ length: BARS }, () => 4 + Math.random() * 18));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, analyserRef]);

  return (
    <div className="flex items-end gap-px" style={{ height: 34 }}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: active ? h : 4,
            background: active
              ? `hsl(${30 + (h / 34) * 20}, 90%, ${45 + (h / 34) * 20}%)`
              : "rgba(212,134,42,0.2)",
            transition: "height 0.06s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Memory Card ─────────────────────────────────────────────────────── */
function MemoryCard({ memory }: { memory: StoredMemory }) {
  const [open, setOpen] = useState(false);
  const color = PHASE_COLORS[memory.phase] || "#8a5021";

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: `${color}30`, background: "rgba(12,8,3,0.6)" }}
    >
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={11} style={{ color, flexShrink: 0 }} />
          <span className="text-[11px] font-sans truncate" style={{ color: `${color}dd` }}>
            {memory.lifeEvent || memory.summary.slice(0, 60)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-sans"
            style={{ background: `${color}20`, color: `${color}cc` }}
          >
            {memory.emotionalTone}
          </span>
          {open ? <ChevronDown size={10} className="text-amber-700" /> : <ChevronRight size={10} className="text-amber-700" />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t" style={{ borderColor: `${color}20` }}>
          <p className="text-[11px] font-sans text-amber-400/70 leading-relaxed pt-2">{memory.summary}</p>

          {memory.importantPeople.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-amber-700/50 mb-1 font-sans">People</div>
              {memory.importantPeople.map((p, i) => (
                <div key={i} className="text-[10px] font-sans text-amber-500/70">
                  <span className="text-amber-300/80">{p.name}</span>
                  {p.relationship && <span className="text-amber-700/50"> · {p.relationship}</span>}
                </div>
              ))}
            </div>
          )}

          {memory.importantPlaces.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-amber-700/50 mb-1 font-sans">Places</div>
              {memory.importantPlaces.map((p, i) => (
                <div key={i} className="text-[10px] font-sans text-amber-500/70">
                  <span className="text-amber-300/80">{p.name}</span>
                  {p.type && <span className="text-amber-700/50"> · {p.type}</span>}
                </div>
              ))}
            </div>
          )}

          {memory.lifeLesson && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-amber-700/50 mb-1 font-sans">Lesson</div>
              <p className="text-[10px] font-serif italic text-amber-400/80">{memory.lifeLesson}</p>
            </div>
          )}

          {memory.memorableQuotes.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-amber-700/50 mb-1 font-sans">Quote</div>
              <p className="text-[10px] font-serif italic text-amber-300/80">
                &ldquo;{memory.memorableQuotes[0]}&rdquo;
              </p>
            </div>
          )}

          {memory.timelinePlacement && (
            <div className="flex items-center gap-1.5">
              <Calendar size={9} className="text-amber-700/50" />
              <span className="text-[9px] font-sans text-amber-700/60">{memory.timelinePlacement}</span>
            </div>
          )}

          {memory.followUpQuestions.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-amber-700/50 mb-1 font-sans">Follow-ups</div>
              {memory.followUpQuestions.slice(0, 2).map((q, i) => (
                <p key={i} className="text-[9.5px] font-sans text-amber-600/60 leading-relaxed">· {q}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Phase Sidebar ───────────────────────────────────────────────────── */
function PhaseSidebar({
  currentPhase,
  completedPhases,
  exchangesByPhase,
  onJumpToPhase,
}: {
  currentPhase: PhaseId;
  completedPhases: Set<PhaseId>;
  exchangesByPhase: Record<string, number>;
  onJumpToPhase: (phase: PhaseId) => void;
}) {
  return (
    <div className="space-y-0.5">
      {INTERVIEW_PHASES.map((phase) => {
        const isActive = phase.id === currentPhase;
        const isDone = completedPhases.has(phase.id);
        const count = exchangesByPhase[phase.id] || 0;
        const color = PHASE_COLORS[phase.id];

        return (
          <div
            key={phase.id}
            onClick={() => onJumpToPhase(phase.id)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer hover:opacity-90"
            style={{
              background: isActive ? `${color}18` : "transparent",
              borderLeft: isActive ? `2px solid ${color}` : "2px solid transparent",
            }}
          >
            <div style={{ color: isDone ? "#6a9a6a" : isActive ? color : "rgba(120,80,30,0.6)" }}>
              {isDone ? <CheckCircle size={12} /> : isActive ? <Circle size={12} style={{ fill: `${color}30` }} /> : <Circle size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-sans font-semibold leading-tight truncate"
                style={{ color: isActive ? color : isDone ? "rgba(160,200,120,0.7)" : "rgba(140,90,30,0.55)" }}
              >
                {phase.name}
              </div>
              {isActive && (
                <div className="text-[9px] font-sans text-amber-800/50 leading-tight truncate mt-0.5">
                  {phase.description}
                </div>
              )}
            </div>
            {count > 0 && (
              <span
                className="text-[9px] font-sans px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${color}20`, color: `${color}aa` }}
              >
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Interviewer Selector ────────────────────────────────────────────── */
function InterviewerSelector({
  selected,
  onSelect,
  onStart,
}: {
  selected: Interviewer;
  onSelect: (i: Interviewer) => void;
  onStart: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="text-center mb-6 md:mb-8">
        <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-2">Interview Center</div>
        <h1 className="text-amber-200 font-serif font-bold text-2xl md:text-3xl mb-2">Choose Your Interviewer</h1>
        <p className="text-amber-700/60 font-serif italic text-sm max-w-md mx-auto">
          Each interviewer brings a unique style and focus to your life story.
        </p>
      </div>

      {/* Mobile: horizontal scroll carousel | Desktop: 5-col grid */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-3 mb-6 snap-x snap-mandatory px-1"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        {INTERVIEWERS.map((iv) => {
          const isSelected = selected.id === iv.id;
          return (
            <button
              key={iv.id}
              onClick={() => onSelect(iv)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-left flex-shrink-0 snap-center"
              style={{
                width: "140px",
                borderColor: isSelected ? `${iv.accentColor}70` : "rgba(90,52,20,0.25)",
                background: isSelected ? `${iv.accentColor}12` : "rgba(15,10,4,0.5)",
                boxShadow: isSelected ? `0 0 20px ${iv.accentColor}20` : "none",
              }}
            >
              <div className="rounded-xl overflow-hidden w-full"
                style={{ border: isSelected ? `1px solid ${iv.accentColor}50` : "1px solid rgba(90,52,20,0.2)" }}>
                <InterviewerPortrait interviewer={iv} size={120} />
              </div>
              <div className="w-full">
                <div className="text-[11px] font-serif font-bold leading-tight"
                  style={{ color: isSelected ? iv.accentColor : "rgba(200,160,90,0.8)" }}>
                  {iv.name.split(" ").slice(0, 2).join(" ")}
                </div>
                <div className="text-[9px] font-sans text-amber-800/50 leading-tight mt-0.5 line-clamp-2">{iv.bestFor}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden md:grid grid-cols-5 gap-3 mb-8">
        {INTERVIEWERS.map((iv) => {
          const isSelected = selected.id === iv.id;
          return (
            <button
              key={iv.id}
              onClick={() => onSelect(iv)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-left"
              style={{
                borderColor: isSelected ? `${iv.accentColor}70` : "rgba(90,52,20,0.25)",
                background: isSelected ? `${iv.accentColor}12` : "rgba(15,10,4,0.5)",
                boxShadow: isSelected ? `0 0 20px ${iv.accentColor}20` : "none",
              }}
            >
              <div
                className="rounded-xl overflow-hidden w-full"
                style={{ border: isSelected ? `1px solid ${iv.accentColor}50` : "1px solid rgba(90,52,20,0.2)" }}
              >
                <InterviewerPortrait interviewer={iv} size={120} />
              </div>
              <div className="w-full">
                <div
                  className="text-[11px] font-serif font-bold leading-tight"
                  style={{ color: isSelected ? iv.accentColor : "rgba(200,160,90,0.8)" }}
                >
                  {iv.name.split(" ").slice(0, 2).join(" ")}
                </div>
                <div className="text-[9px] font-sans text-amber-800/50 leading-tight mt-0.5 line-clamp-2">
                  {iv.bestFor}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected interviewer detail */}
      <div
        className="rounded-2xl p-4 md:p-6 mb-6 flex flex-col md:flex-row gap-4 md:gap-6"
        style={{ background: "rgba(20,12,4,0.7)", border: `1px solid ${selected.accentColor}30` }}
      >
        <div className="w-20 md:w-28 flex-shrink-0 rounded-xl overflow-hidden mx-auto md:mx-0" style={{ border: `1px solid ${selected.accentColor}40` }}>
          <InterviewerPortrait interviewer={selected} size={112} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div style={{ color: selected.accentColor }} className="text-xs font-sans uppercase tracking-widest mb-1">
            {selected.ethnicity} · Age {selected.age}
          </div>
          <h2 className="text-amber-100 font-serif font-bold text-xl mb-1">{selected.name}</h2>
          <p className="text-amber-700/70 text-sm font-sans mb-3">{selected.title}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.style.map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-sans"
                style={{ background: `${selected.accentColor}20`, color: `${selected.accentColor}bb`, border: `1px solid ${selected.accentColor}30` }}>
                {s}
              </span>
            ))}
          </div>
          <div
            className="rounded-xl p-3 text-sm font-serif italic text-amber-300/80"
            style={{ background: "rgba(40,24,8,0.5)", border: `1px solid ${selected.accentColor}20` }}
          >
            &ldquo;{selected.openingQuestion}&rdquo;
          </div>
        </div>
      </div>

      {/* Phase overview */}
      <div className="mb-6">
        <div className="text-amber-700/50 text-xs font-sans uppercase tracking-widest mb-3">Interview Framework — 9 Phases</div>
        <div className="grid grid-cols-3 gap-2">
          {INTERVIEW_PHASES.map((phase) => (
            <div
              key={phase.id}
              className="flex items-start gap-2 p-2.5 rounded-xl"
              style={{ background: "rgba(15,10,4,0.5)", border: "1px solid rgba(90,52,20,0.2)" }}
            >
              <div className="mt-0.5" style={{ color: PHASE_COLORS[phase.id] }}>
                {PHASE_ICONS[phase.id]}
              </div>
              <div>
                <div className="text-[11px] font-sans font-semibold text-amber-300/80">{phase.name}</div>
                <div className="text-[9px] font-sans text-amber-800/50 leading-tight">{phase.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-3.5 rounded-xl font-serif font-semibold text-amber-50 text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: `linear-gradient(135deg, ${selected.accentColor}, #c8843a)`,
          boxShadow: `0 4px 24px ${selected.accentColor}40`,
        }}
      >
        Begin Interview with {selected.name.split(" ")[0]}
      </button>
    </div>
  );
}

/* ─── Session Summary ─────────────────────────────────────────────────── */
function SessionSummaryView({
  sessionId,
  interviewer,
  onNewSession,
  onViewStory,
}: {
  sessionId: string;
  interviewer: Interviewer;
  onNewSession: () => void;
  onViewStory: () => void;
}) {
  const [summary, setSummary] = useState<null | {
    title: string; summary: string; keyPeople: string[]; keyPlaces: string[];
    keyEvents: string[]; lifeLessons: string[]; memorableQuotes: string[];
    suggestedFollowUps: string[];
  }>(null);
  const [loading, setLoading] = useState(true);
  const exchanges = getExchanges(sessionId);

  useEffect(() => {
    async function generate() {
      try {
        const messages = exchanges.flatMap((ex) => [
          { role: "assistant", content: ex.question },
          { role: "user", content: ex.answer },
        ]);
        const res = await fetch("/api/interview/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, interviewerName: interviewer.name }),
        });
        const data = await res.json();
        const s = data.summary || data;
        setSummary(s);
        await updateSession(sessionId, {
          completedAt: new Date().toISOString(),
          title: s.title,
          summary: s,
        });
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${interviewer.accentColor}, #c8843a)` }}>
          <CheckCircle size={28} className="text-amber-100" />
        </div>
        <h1 className="text-amber-200 font-serif font-bold text-3xl mb-2">Session Complete</h1>
        <p className="text-amber-700/60 font-serif italic text-sm">
          {exchanges.length} exchange{exchanges.length !== 1 ? "s" : ""} captured · {interviewer.name}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={32} className="text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-amber-700/60 font-serif italic text-sm">Generating your session summary…</p>
        </div>
      ) : summary ? (
        <div className="space-y-5">
          {summary.title && (
            <div className="text-center">
              <h2 className="text-amber-300 font-serif font-bold text-xl">&ldquo;{summary.title}&rdquo;</h2>
            </div>
          )}

          <div className="rounded-xl p-5" style={{ background: "rgba(20,12,4,0.7)", border: "1px solid rgba(90,52,20,0.3)" }}>
            <div className="text-amber-600/50 text-[10px] uppercase tracking-widest mb-3 font-sans">Session Summary</div>
            <p className="text-amber-300/80 font-serif text-sm leading-relaxed">{summary.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {summary.keyPeople.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={12} className="text-amber-600/60" />
                  <div className="text-[10px] uppercase tracking-widest text-amber-700/50 font-sans">People Mentioned</div>
                </div>
                {summary.keyPeople.map((p, i) => (
                  <div key={i} className="text-xs font-sans text-amber-400/70 py-0.5">· {p}</div>
                ))}
              </div>
            )}
            {summary.keyPlaces.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={12} className="text-amber-600/60" />
                  <div className="text-[10px] uppercase tracking-widest text-amber-700/50 font-sans">Places Mentioned</div>
                </div>
                {summary.keyPlaces.map((p, i) => (
                  <div key={i} className="text-xs font-sans text-amber-400/70 py-0.5">· {p}</div>
                ))}
              </div>
            )}
          </div>

          {summary.lifeLessons.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={12} className="text-amber-600/60" />
                <div className="text-[10px] uppercase tracking-widest text-amber-700/50 font-sans">Life Lessons</div>
              </div>
              {summary.lifeLessons.map((l, i) => (
                <div key={i} className="text-xs font-serif italic text-amber-400/70 py-0.5">· {l}</div>
              ))}
            </div>
          )}

          {summary.memorableQuotes.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Quote size={12} className="text-amber-600/60" />
                <div className="text-[10px] uppercase tracking-widest text-amber-700/50 font-sans">Memorable Quotes</div>
              </div>
              {summary.memorableQuotes.map((q, i) => (
                <p key={i} className="text-sm font-serif italic text-amber-300/80 py-1 border-b border-amber-900/20 last:border-0">
                  &ldquo;{q}&rdquo;
                </p>
              ))}
            </div>
          )}

          {summary.suggestedFollowUps.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <ChevronRight size={12} className="text-amber-600/60" />
                <div className="text-[10px] uppercase tracking-widest text-amber-700/50 font-sans">Suggested Follow-ups for Next Session</div>
              </div>
              {summary.suggestedFollowUps.map((q, i) => (
                <div key={i} className="text-xs font-sans text-amber-500/70 py-0.5">· {q}</div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-amber-700/50 font-serif italic text-sm">
          Summary could not be generated — your answers have been saved.
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          onClick={onViewStory}
          className="flex-1 py-3 rounded-xl font-serif font-semibold text-amber-50 text-sm transition-all hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)", boxShadow: "0 4px 24px rgba(120,70,18,0.3)" }}
        >
          <BookOpen size={14} className="inline mr-2" />
          View Full Story
        </button>
        <button
          onClick={onNewSession}
          className="flex-1 py-3 rounded-xl font-serif text-sm text-amber-500 border border-amber-800/40 hover:bg-amber-900/20 transition-all"
        >
          <RotateCcw size={14} className="inline mr-2" />
          Start New Session
        </button>
      </div>
    </div>
  );
}

/* ─── Name extraction helper ──────────────────────────────────────────── */
function extractName(text: string): string | null {
  const patterns = [
    /(?:my name is|i'm|i am|call me|name's)\s+([A-Z][a-z]+)/i,
    /^([A-Z][a-z]{1,})[,.\s!]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1] && m[1].length > 1) return m[1];
  }
  return null;
}

/* ─── Main Interview Inner ────────────────────────────────────────────── */
function InterviewInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewerId = searchParams.get("interviewer") || "dr_james_carter";

  const interviewer = useMemo(
    () => INTERVIEWERS.find((i) => i.id === interviewerId) || INTERVIEWERS[0],
    [interviewerId]
  );

  /* ── Auth + resume ── */
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [resumeSession, setResumeSession] = useState<{ sessionId: string; phase: PhaseId; exchangeCount: number; userName?: string } | null>(null);
  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthenticated(!!data.session);
        if (data.session) {
          // Find most recent incomplete session
          const sessions = getSessions().filter(s => !s.completedAt);
          if (sessions.length > 0) {
            const latest = sessions[0];
            const exchanges = getExchanges(latest.id);
            const lastPhase = exchanges.length > 0 ? exchanges[exchanges.length - 1].phase : "hook";
            setResumeSession({ sessionId: latest.id, phase: lastPhase as PhaseId, exchangeCount: exchanges.length, userName: latest.userName });
          }
        }
      });
    });
  }, []);

  /* ── State ── */
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer>(interviewer);
  const [interviewState, setInterviewState] = useState<InterviewState>(
    searchParams.get("interviewer") ? "ready" : "select"
  );
  const [sessionId, setSessionId] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<PhaseId>("hook");
  const [phaseQuestionCount, setPhaseQuestionCount] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<Set<PhaseId>>(new Set());
  const [exchanges, setExchanges] = useState<ActiveExchange[]>([]);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFreemiumGate, setShowFreemiumGate] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [questionError, setQuestionError]         = useState(false);  // fetch timed out / failed
  const [ttsError, setTtsError]                   = useState(false);  // audio stuck / failed
  const [memoriesOpen, setMemoriesOpen] = useState(true);
  const [showTypeMode, setShowTypeMode] = useState(false);
  const [userName, setUserName] = useState<string>("");

  /* ── Refs ── */
  const synthRef = useRef<SpeechSynthesis | null>(null); // unused — kept to avoid refactor
  const ttsCtxRef    = useRef<AudioContext | null>(null);       // shared AudioContext for TTS
  const ttsSourceRef = useRef<AudioBufferSourceNode | null>(null); // current playing node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Tracks whether we WANT to be recording (so onend knows to restart)
  const activelyRecordingRef = useRef(false);
  // Accumulates finalized speech text (avoids stale closure in onresult)
  const finalTextRef = useRef("");
  // Web Audio analyser for volume-reactive waveform
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  // All questions asked so far — AI never repeats these
  const askedQuestionsRef = useRef<string[]>([]);
  // 7-minute auto-stop timer
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RECORD_MS = 7 * 60 * 1000;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, currentQuestion]);

  /* ── TTS via OpenAI + AudioContext ────────────────────────────────────
     AudioContext, once resumed after a user gesture, stays running and can
     play audio from async callbacks — unlike new Audio() which loses the
     gesture context after ~1 second.
  ───────────────────────────────────────────────────────────────────── */

  // Unlock / resume AudioContext on first user interaction so async plays work
  useEffect(() => {
    const unlock = () => {
      if (!ttsCtxRef.current) {
        ttsCtxRef.current = new AudioContext();
      }
      if (ttsCtxRef.current.state === "suspended") {
        ttsCtxRef.current.resume();
      }
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    try { ttsSourceRef.current?.stop(); } catch {}
    ttsSourceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, _gender?: "male" | "female", voiceName?: string) => {
    if (!ttsEnabled || !text.trim()) return;
    stopSpeaking();
    setIsSpeaking(true);
    setTtsError(false);

    // Ensure AudioContext exists and is running
    if (!ttsCtxRef.current) ttsCtxRef.current = new AudioContext();
    const ctx = ttsCtxRef.current;

    // 12-second fetch timeout — if TTS API hangs, fail gracefully
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 12_000);

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), voice: voiceName ?? "alloy" }),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(fetchTimeout);
        if (!res.ok) throw new Error(`TTS ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buf) => ctx.decodeAudioData(buf))
      .then((audioBuffer) => {
        if (ctx.state === "suspended") ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        // Watchdog: if onended never fires within duration + 6s, force-reset
        const watchdog = setTimeout(() => {
          try { source.stop(); } catch {}
          ttsSourceRef.current = null;
          setIsSpeaking(false);
        }, (audioBuffer.duration + 6) * 1000);

        source.onended = () => {
          clearTimeout(watchdog);
          ttsSourceRef.current = null;
          setIsSpeaking(false);
        };
        ttsSourceRef.current = source;
        source.start(0);
      })
      .catch((err) => {
        clearTimeout(fetchTimeout);
        // Only show error UI if it's not a deliberate abort (e.g. user skipped)
        if (err?.name !== "AbortError") setTtsError(true);
        setIsSpeaking(false);
      });
  }, [ttsEnabled, stopSpeaking]);

  /* ── Phase advancement ── */
  const advancePhase = useCallback((current: PhaseId): PhaseId => {
    const idx = INTERVIEW_PHASES.findIndex((p) => p.id === current);
    if (idx < INTERVIEW_PHASES.length - 1) return INTERVIEW_PHASES[idx + 1].id;
    return current;
  }, []);

  /* ── Fetch next question ── */
  // Snapshot of last fetch args so the Retry button can replay the call
  const lastFetchArgsRef = useRef<{ phase: PhaseId; history: LiveMessage[]; sid: string } | null>(null);

  const fetchNextQuestion = useCallback(async (
    phase: PhaseId,
    history: LiveMessage[],
    sid: string
  ) => {
    lastFetchArgsRef.current = { phase, history, sid };
    setIsLoadingQuestion(true);
    setQuestionError(false);

    // 15-second hard timeout — surface retry UI if OpenAI hangs
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewerId: selectedInterviewer.id,
          messages: history,
          profileContext: "",
          currentPhase: phase,
          askedQuestions: askedQuestionsRef.current,
          userName: userName || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(fetchTimeout);
      const data = await res.json();
      const q = data.question || "What else would you like to share?";
      askedQuestionsRef.current = [...askedQuestionsRef.current, q];
      setCurrentQuestion(q);
      setLiveMessages((prev) => [...prev, { role: "assistant", content: q }]);
      if (ttsEnabled) speak(q, selectedInterviewer.gender, selectedInterviewer.voiceName);
    } catch {
      clearTimeout(fetchTimeout);
      setQuestionError(true); // show Retry / Skip UI — don't silently repeat a canned phrase
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [selectedInterviewer.id, ttsEnabled, speak, userName]);

  /* ── Start interview ── */
  const startInterview = useCallback(() => {
    createSession(selectedInterviewer.id, selectedInterviewer.name).then((session) => {
    setSessionId(session.id);
    setInterviewState("active");
    setCurrentPhase("hook");
    setPhaseQuestionCount(0);
    setExchanges([]);
    setLiveMessages([]);
    setCurrentAnswer("");
    setAccumulatedTranscript("");

    const opening = OPENING_QUESTIONS[selectedInterviewer.id]?.hook ||
      "What is one story from your life that people never get tired of hearing?";

    setCurrentQuestion(opening);
    setLiveMessages([{ role: "assistant", content: opening }]);
    if (ttsEnabled) setTimeout(() => speak(opening, selectedInterviewer.gender, selectedInterviewer.voiceName), 300);
    });
  }, [selectedInterviewer, ttsEnabled, speak]);

  /* ── Resume session ── */
  const resumeInterview = useCallback(() => {
    if (!resumeSession) return;
    const prevExchanges = getExchanges(resumeSession.sessionId);
    if (resumeSession.userName) setUserName(resumeSession.userName);
    setSessionId(resumeSession.sessionId);
    setCurrentPhase(resumeSession.phase);
    setPhaseQuestionCount(0);
    setCompletedPhases(new Set(
      INTERVIEW_PHASES.slice(0, INTERVIEW_PHASES.findIndex(p => p.id === resumeSession.phase)).map(p => p.id)
    ));
    setExchanges(prevExchanges.map(e => ({ id: e.id, question: e.question, answer: e.answer, phase: e.phase, memory: e.memory })));
    const liveHistory: LiveMessage[] = [];
    prevExchanges.forEach(e => {
      liveHistory.push({ role: "assistant", content: e.question });
      liveHistory.push({ role: "user", content: e.answer });
    });
    setLiveMessages(liveHistory);
    setCurrentAnswer("");
    setAccumulatedTranscript("");
    setInterviewState("active");
    fetchNextQuestion(resumeSession.phase, liveHistory, resumeSession.sessionId);
  }, [resumeSession, fetchNextQuestion]);

  /* ── Recording controls ── */
  const startRecording = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setShowTypeMode(true);
      return;
    }

    activelyRecordingRef.current = true;
    // Seed the ref with whatever was already typed/recorded
    finalTextRef.current = currentAnswer;

    // Auto-stop after 7 minutes
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = setTimeout(() => {
      activelyRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
      setRecordingState("stopped");
    }, MAX_RECORD_MS);

    const spawnRecognition = () => {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = "en-US";
      r.maxAlternatives = 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTextRef.current = (finalTextRef.current + " " + t).trimStart();
            setAccumulatedTranscript(finalTextRef.current);
          } else {
            interim += t;
          }
        }
        // Always show final + current interim in the answer box
        setCurrentAnswer(
          interim
            ? finalTextRef.current + (finalTextRef.current ? " " : "") + interim
            : finalTextRef.current
        );
      };

      // Chrome stops recognition after silence or a timeout — restart it
      // automatically as long as we still want to be recording.
      r.onend = () => {
        if (activelyRecordingRef.current) {
          // Small delay prevents "InvalidStateError: already started"
          setTimeout(() => {
            if (!activelyRecordingRef.current) return;
            try {
              recognitionRef.current = spawnRecognition();
            } catch {
              activelyRecordingRef.current = false;
              if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
              setRecordingState("stopped");
            }
          }, 250);
        } else {
          setRecordingState((prev) => (prev === "recording" ? "stopped" : prev));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      r.onerror = (event: any) => {
        // These are non-fatal — onend fires next and will restart
        if (["no-speech", "aborted", "network"].includes(event.error)) return;
        // Fatal errors (not-allowed, service-not-allowed, etc.)
        activelyRecordingRef.current = false;
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        setRecordingState("stopped");
        if (event.error === "not-allowed") setShowTypeMode(true);
      };

      r.start();
      return r;
    };

    recognitionRef.current = spawnRecognition();
    setRecordingState("recording");
    stopSpeaking();

    // Set up Web Audio analyser for volume-reactive waveform
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        micStreamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;
      })
      .catch(() => { /* analyser unavailable — waveform falls back to animation */ });
  }, [currentAnswer, stopSpeaking, MAX_RECORD_MS]);

  /** Tear down the audio analyser and mic stream */
  const teardownAnalyser = useCallback(() => {
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    micStreamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const pauseRecording = useCallback(() => {
    activelyRecordingRef.current = false;
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    teardownAnalyser();
    setRecordingState("paused");
  }, [teardownAnalyser]);

  const resumeRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const stopRecording = useCallback(() => {
    activelyRecordingRef.current = false;
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    teardownAnalyser();
    setRecordingState("stopped");
  }, [teardownAnalyser]);

  /* ── Extract memory ── */
  const extractMemory = useCallback(async (exchange: ActiveExchange) => {
    setExchanges((prev) =>
      prev.map((ex) => ex.id === exchange.id ? { ...ex, extracting: true } : ex)
    );
    try {
      const res = await fetch("/api/interview/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: exchange.question,
          answer: exchange.answer,
          phase: exchange.phase,
          existingContext: "",
        }),
      });
      const data = await res.json();
      const memory = data.memory as StoredMemory;
      setExchanges((prev) =>
        prev.map((ex) => ex.id === exchange.id ? { ...ex, memory, extracting: false } : ex)
      );
      await updateExchange(exchange.id, { memory });
    } catch {
      setExchanges((prev) =>
        prev.map((ex) => ex.id === exchange.id ? { ...ex, extracting: false } : ex)
      );
    }
  }, []);

  /* ── Save answer ── */
  const saveAnswer = useCallback(async () => {
    const answer = currentAnswer.trim();
    if (!answer || !currentQuestion) return;

    stopSpeaking();
    stopRecording();

    // Save to storage
    const stored = await saveExchange(sessionId, currentPhase, currentQuestion, answer);

    const newExchange: ActiveExchange = {
      id: stored.id,
      question: currentQuestion,
      answer,
      phase: currentPhase,
    };

    setExchanges((prev) => [...prev, newExchange]);
    setLiveMessages((prev) => [...prev, { role: "user", content: answer }]);

    // Reset answer state
    setCurrentAnswer("");
    setAccumulatedTranscript("");
    setRecordingState("idle");
    setShowTypeMode(false);

    // Advance phase if needed
    const nextCount = phaseQuestionCount + 1;
    let nextPhase = currentPhase;
    if (nextCount >= PHASE_QUESTIONS_PER[currentPhase]) {
      setCompletedPhases((prev) => new Set([...prev, currentPhase]));
      // Freemium gate — after Story Hook phase, prompt sign up
      if (currentPhase === "hook" && !isAuthenticated) {
        stopSpeaking();
        setShowFreemiumGate(true);
        return;
      }
      nextPhase = advancePhase(currentPhase);
      setCurrentPhase(nextPhase);
      setPhaseQuestionCount(0);
    } else {
      setPhaseQuestionCount(nextCount);
    }

    // Extract name from first answer
    if (exchanges.length === 0 && !userName) {
      const extracted = extractName(answer);
      if (extracted) {
        setUserName(extracted);
        await updateSession(sessionId, { userName: extracted });
      }
    }

    // Extract memory in background
    extractMemory(newExchange);

    // Fetch next question
    const updatedHistory: LiveMessage[] = [
      ...liveMessages,
      { role: "user", content: answer },
    ];
    await fetchNextQuestion(nextPhase, updatedHistory, sessionId);
  }, [
    currentAnswer, currentQuestion, sessionId, currentPhase, phaseQuestionCount,
    stopSpeaking, stopRecording, advancePhase, extractMemory, fetchNextQuestion, liveMessages,
    userName, exchanges.length,
  ]);

  /* ── Edit exchange ── */
  const startEdit = useCallback((id: string) => {
    setExchanges((prev) =>
      prev.map((ex) => ex.id === id ? { ...ex, editing: true, editDraft: ex.answer } : ex)
    );
  }, []);

  const saveEdit = useCallback((id: string) => {
    setExchanges((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        const updated = { ...ex, answer: ex.editDraft || ex.answer, editing: false };
        updateExchange(id, { answer: updated.answer }).catch(console.error);
        // Re-extract memory with new answer
        setTimeout(() => extractMemory(updated), 500);
        return updated;
      })
    );
  }, [extractMemory]);

  const cancelEdit = useCallback((id: string) => {
    setExchanges((prev) =>
      prev.map((ex) => ex.id === id ? { ...ex, editing: false, editDraft: undefined } : ex)
    );
  }, []);

  /* ── End session ── */
  const endSession = useCallback(() => {
    stopSpeaking();
    stopRecording();
    setInterviewState("summary");
  }, [stopSpeaking, stopRecording]);

  /* ── Exchange count by phase ── */
  const exchangesByPhase = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ex of exchanges) {
      map[ex.phase] = (map[ex.phase] || 0) + 1;
    }
    return map;
  }, [exchanges]);

  /* ─────────────────────────────────────────────────────────────────── */
  if (interviewState === "select") {
    return (
      <div
        className="min-h-screen overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}
      >
        <div className="sticky top-0 z-10 px-6 py-3 border-b border-amber-900/20 flex items-center gap-3"
          style={{ background: "rgba(10,6,2,0.9)", backdropFilter: "blur(8px)" }}>
          <button onClick={() => router.push("/dashboard")} className="text-amber-700 hover:text-amber-400 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="text-amber-700/60 font-sans text-sm">Interview Center</span>
        </div>
        <InterviewerSelector
          selected={selectedInterviewer}
          onSelect={setSelectedInterviewer}
          onStart={() => setInterviewState("ready")}
        />
      </div>
    );
  }

  if (interviewState === "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
        <div className="text-center max-w-md px-6">
          <div className="w-28 mx-auto rounded-2xl overflow-hidden mb-5"
            style={{ border: `2px solid ${selectedInterviewer.accentColor}50` }}>
            <InterviewerPortrait interviewer={selectedInterviewer} size={112} />
          </div>
          <h2 className="text-amber-200 font-serif font-bold text-2xl mb-2">
            {resumeSession
              ? `Welcome back${resumeSession.userName ? `, ${resumeSession.userName}` : ""}`
              : "Ready when you are"}
          </h2>
          <p className="text-amber-700/60 font-serif italic text-sm mb-2">
            {resumeSession
              ? `You have an interview in progress — ${resumeSession.exchangeCount} answer${resumeSession.exchangeCount !== 1 ? "s" : ""} saved.`
              : `${selectedInterviewer.name} will guide you through 9 chapters of your story.`}
          </p>
          {/* Interviewer introduction — shown on first visit only */}
          {!resumeSession && (
            <div className="rounded-xl px-4 py-3 mb-4 text-left"
              style={{ background: `${selectedInterviewer.accentColor}10`, border: `1px solid ${selectedInterviewer.accentColor}25` }}>
              <p className="text-amber-400/80 font-serif italic text-xs leading-relaxed">
                &ldquo;{selectedInterviewer.introduction}&rdquo;
              </p>
            </div>
          )}
          <p className="text-amber-800/50 text-xs font-sans mb-8">
            {resumeSession ? "Pick up right where you left off." : "Find a quiet place. Speak naturally. There are no wrong answers."}
          </p>
          <div className="flex flex-col gap-3">
            {resumeSession && (
              <button onClick={resumeInterview}
                className="w-full py-3 rounded-xl font-serif font-semibold text-amber-50 text-sm transition-all hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)`, boxShadow: `0 4px 20px ${selectedInterviewer.accentColor}40` }}>
                Continue Interview
              </button>
            )}
            <div className="flex gap-3">
              <button onClick={() => setInterviewState("select")}
                className="flex-1 py-3 rounded-xl font-serif text-sm text-amber-600 border border-amber-800/30 hover:bg-amber-900/20 transition-all">
                Change Interviewer
              </button>
              <button onClick={startInterview}
                className="flex-1 py-3 rounded-xl font-serif font-semibold text-amber-50 text-sm transition-all hover:scale-[1.02]"
                style={{ background: resumeSession ? "rgba(80,50,20,0.5)" : `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)`, boxShadow: resumeSession ? "none" : `0 4px 20px ${selectedInterviewer.accentColor}40`, border: resumeSession ? "1px solid rgba(101,67,20,0.4)" : "none" }}>
                {resumeSession ? "Start Fresh" : "Begin Interview"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (interviewState === "summary") {
    return (
      <div className="min-h-screen overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
        <SessionSummaryView
          sessionId={sessionId}
          interviewer={selectedInterviewer}
          onNewSession={() => {
            setInterviewState("select");
            setExchanges([]);
            setLiveMessages([]);
          }}
          onViewStory={() => router.push("/biography")}
        />
      </div>
    );
  }

  /* ── Active interview layout ── */
  const phaseColor = PHASE_COLORS[currentPhase];
  const hasAnswer = currentAnswer.trim().length > 0;
  const canSave = hasAnswer && !isLoadingQuestion;

  /* ── Freemium gate modal ── */
  if (showFreemiumGate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 50%, #1a1006 100%)" }}>
        <div className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: "rgba(20,12,4,0.95)", border: "1px solid rgba(180,120,30,0.3)", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
          {/* Icon */}
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7a4a12,#c8843a)" }}>
            <span className="text-2xl">📖</span>
          </div>
          <h2 className="text-amber-100 font-serif font-bold text-2xl mb-2">Your Story Has Begun</h2>
          <p className="text-amber-300/70 font-serif italic text-sm mb-4">
            &ldquo;Every life has a story worth preserving.&rdquo;
          </p>
          <p className="text-amber-700/80 font-sans text-sm mb-6 leading-relaxed">
            You&apos;ve completed the Story Hook — the heart of your interview. Sign up to unlock all 9 interview phases, save your memories, and build your legacy story.
          </p>
          <div className="space-y-3 mb-6">
            {["9 full interview phases", "AI-powered memory extraction", "Biography & legacy documents", "Private family sharing vault"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm font-sans text-amber-300/80">
                <span style={{ color: "#c8843a" }}>✓</span> {f}
              </div>
            ))}
          </div>
          <Link href="/sign-up"
            className="block w-full py-3.5 rounded-xl font-serif font-semibold text-amber-50 text-base mb-3 transition-all hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg,#7a4a12,#c8843a)", boxShadow: "0 4px 24px rgba(180,100,30,0.4)" }}>
            Create Free Account
          </Link>
          <button
            onClick={() => {
              setShowFreemiumGate(false);
              const nextPhase = advancePhase("hook");
              setCurrentPhase(nextPhase);
              setPhaseQuestionCount(0);
              fetchNextQuestion(nextPhase, liveMessages, sessionId);
            }}
            className="block w-full py-2.5 rounded-xl font-sans text-xs text-amber-700/60 hover:text-amber-600/80 transition-colors">
            Continue without saving →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] md:h-screen" style={{ background: "linear-gradient(160deg, #0f0a04 0%, #1c1208 60%, #110a04 100%)" }}>

      {/* ── Left sidebar: Phase progress (desktop only) ── */}
      <div className="hidden md:flex w-52 flex-shrink-0 flex-col border-r border-amber-900/20 overflow-hidden">
        <div className="px-3 py-3 border-b border-amber-900/20 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden">
            <InterviewerPortrait interviewer={selectedInterviewer} size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-sans font-semibold text-amber-400/80 truncate">
              {selectedInterviewer.name.split(" ")[0]}
            </div>
            <div className="text-[8px] font-sans text-amber-800/50 truncate">
              {exchanges.length} saved
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-1">
          <div className="text-[9px] uppercase tracking-widest text-amber-800/40 font-sans px-3 mb-2">Progress</div>
          <PhaseSidebar
            currentPhase={currentPhase}
            completedPhases={completedPhases}
            exchangesByPhase={exchangesByPhase}
            onJumpToPhase={(phase) => {
              if (phase === currentPhase) return;
              stopSpeaking();
              setCurrentPhase(phase);
              setPhaseQuestionCount(0);
              fetchNextQuestion(phase, liveMessages, sessionId);
            }}
          />
        </div>

        <div className="p-3 border-t border-amber-900/20 space-y-1.5">
          <button
            onClick={() => { stopSpeaking(); if (isSpeaking) return; speak(currentQuestion, selectedInterviewer.gender, selectedInterviewer.voiceName); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-sans transition-all"
            style={{ background: isSpeaking ? `${phaseColor}20` : "rgba(30,18,6,0.5)", color: isSpeaking ? phaseColor : "rgba(160,110,50,0.7)", border: `1px solid ${isSpeaking ? phaseColor + "40" : "rgba(90,52,20,0.2)"}` }}
          >
            {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
            {isSpeaking ? "Stop playback" : "Replay question"}
          </button>
          <button
            onClick={endSession}
            disabled={exchanges.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-sans text-amber-700/60 hover:text-amber-500/80 border border-amber-900/20 hover:border-amber-800/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle size={11} />
            End & Summarize
          </button>
        </div>
      </div>

      {/* ── Center: Conversation ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 md:px-5 py-2.5 border-b border-amber-900/20 flex-shrink-0"
          style={{ background: "rgba(10,6,2,0.6)" }}>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => router.push("/dashboard")} className="text-amber-800/60 hover:text-amber-500 transition-colors">
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: phaseColor }} />
              <span className="text-[11px] font-sans font-semibold" style={{ color: phaseColor }}>
                {INTERVIEW_PHASES.find((p) => p.id === currentPhase)?.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => { setTtsEnabled(!ttsEnabled); stopSpeaking(); }}
              className="text-amber-800/50 hover:text-amber-500 transition-colors"
              title={ttsEnabled ? "Mute" : "Unmute"}
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <span className="text-amber-800/40 text-[10px] font-sans">{exchanges.length} saved</span>
            {/* Mobile end session */}
            <button onClick={endSession} disabled={exchanges.length === 0}
              className="md:hidden text-[10px] font-sans text-amber-700/50 disabled:opacity-30 border border-amber-900/30 px-2 py-1 rounded-lg">
              Done
            </button>
          </div>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4 md:py-5 space-y-4 md:space-y-5">
          {/* Past exchanges */}
          {exchanges.map((ex) => (
            <div key={ex.id} className="space-y-2">
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-serif font-bold text-amber-100 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)` }}>
                  {selectedInterviewer.name[0]}
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-serif text-amber-300/90 leading-relaxed"
                  style={{ background: "rgba(28,16,6,0.8)", border: "1px solid rgba(90,52,20,0.25)" }}>
                  {ex.question}
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 max-w-xl">
                  {ex.editing ? (
                    <div className="space-y-2">
                      <textarea
                        value={ex.editDraft || ""}
                        onChange={(e) =>
                          setExchanges((prev) =>
                            prev.map((x) => x.id === ex.id ? { ...x, editDraft: e.target.value } : x)
                          )
                        }
                        className="w-full rounded-xl px-3 py-2.5 text-sm font-sans text-amber-200 resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                        style={{ background: "rgba(40,24,10,0.8)", border: "1px solid rgba(120,80,30,0.4)", minHeight: "80px" }}
                        rows={4}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => cancelEdit(ex.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-amber-700/60 hover:text-amber-500 transition-colors">
                          <X size={11} /> Cancel
                        </button>
                        <button onClick={() => saveEdit(ex.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans text-amber-100 transition-all"
                          style={{ background: "rgba(120,70,18,0.8)" }}>
                          <Check size={11} /> Save Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative">
                      <div className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-sans text-amber-200/85 leading-relaxed"
                        style={{ background: "rgba(45,28,10,0.7)", border: "1px solid rgba(120,80,30,0.3)" }}>
                        {ex.answer}
                      </div>
                      <button
                        onClick={() => startEdit(ex.id)}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(60,36,12,0.9)", border: "1px solid rgba(120,80,30,0.4)" }}
                        title="Edit transcript"
                      >
                        <Edit3 size={9} className="text-amber-500/80" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-serif font-bold"
                  style={{ background: "rgba(40,24,10,0.8)", color: "rgba(200,160,80,0.8)", border: "1px solid rgba(90,52,20,0.3)" }}>
                  You
                </div>
              </div>

              {/* Memory extraction status */}
              {ex.extracting && (
                <div className="flex items-center gap-2 pl-10">
                  <Loader2 size={10} className="text-amber-700/50 animate-spin" />
                  <span className="text-[9px] font-sans text-amber-800/50">Extracting memories…</span>
                </div>
              )}
              {ex.memory && !ex.extracting && (
                <div className="pl-10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={9} style={{ color: phaseColor }} />
                    <span className="text-[9px] font-sans" style={{ color: `${phaseColor}99` }}>
                      {ex.memory.importantPeople.length > 0 && `${ex.memory.importantPeople.length} people · `}
                      {ex.memory.importantPlaces.length > 0 && `${ex.memory.importantPlaces.length} places · `}
                      {ex.memory.lifeLesson && "1 lesson · "}
                      {ex.memory.emotionalTone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Current question */}
          {currentQuestion && !isLoadingQuestion && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-serif font-bold text-amber-100 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)` }}>
                {selectedInterviewer.name[0]}
              </div>
              <div
                className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3 text-sm font-serif leading-relaxed"
                style={{
                  background: "rgba(28,16,6,0.9)",
                  border: `1px solid ${phaseColor}30`,
                  color: "rgba(240,215,160,0.95)",
                  boxShadow: `0 0 20px ${phaseColor}10`,
                }}
              >
                {isSpeaking && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: `${phaseColor}20` }}>
                    <RecordingWave active={true} analyserRef={analyserRef} />
                    <span className="text-[9px] font-sans" style={{ color: `${phaseColor}90` }}>Speaking…</span>
                  </div>
                )}
                {currentQuestion}
              </div>
            </div>
          )}

          {/* Loading next question */}
          {isLoadingQuestion && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-serif font-bold text-amber-100"
                style={{ background: `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)` }}>
                {selectedInterviewer.name[0]}
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 border"
                style={{ background: "rgba(28,16,6,0.9)", borderColor: `${phaseColor}25` }}>
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map((delay) => (
                    <div key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: phaseColor, animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Question fetch failed — Retry / Skip */}
          {questionError && !isLoadingQuestion && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-serif font-bold text-amber-100"
                style={{ background: `linear-gradient(135deg, ${selectedInterviewer.accentColor}, #c8843a)` }}>
                {selectedInterviewer.name[0]}
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 border flex flex-col gap-2"
                style={{ background: "rgba(28,10,6,0.95)", borderColor: "rgba(180,60,40,0.35)" }}>
                <p className="font-sans text-xs" style={{ color: "rgba(220,140,110,0.9)" }}>
                  Having trouble reaching the interviewer. Check your connection and try again.
                </p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => {
                      if (lastFetchArgsRef.current) {
                        const { phase, history, sid } = lastFetchArgsRef.current;
                        fetchNextQuestion(phase, history, sid);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all hover:opacity-90"
                    style={{ background: `${phaseColor}30`, border: `1px solid ${phaseColor}50`, color: phaseColor }}
                  >
                    <RotateCcw size={11} /> Retry
                  </button>
                  <button
                    onClick={() => {
                      // Skip — use a short neutral prompt so the interview can continue
                      const skip = "Take your time — what would you like to share next?";
                      setQuestionError(false);
                      setCurrentQuestion(skip);
                      setLiveMessages((prev) => [...prev, { role: "assistant", content: skip }]);
                    }}
                    className="px-3 py-1.5 rounded-lg font-sans text-xs border transition-all hover:opacity-80"
                    style={{ borderColor: "rgba(90,52,20,0.4)", color: "rgba(160,110,50,0.7)" }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TTS audio error — gentle notice + replay button */}
          {ttsError && !isSpeaking && currentQuestion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mx-1 mb-1"
              style={{ background: "rgba(30,14,4,0.85)", border: "1px solid rgba(150,80,20,0.3)" }}>
              <span className="font-sans text-[10px] flex-1" style={{ color: "rgba(180,130,70,0.8)" }}>
                Audio couldn&apos;t load — you can still read the question above.
              </span>
              <button
                onClick={() => {
                  setTtsError(false);
                  speak(currentQuestion, selectedInterviewer.gender, selectedInterviewer.voiceName);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-sans text-[10px] font-semibold transition-all hover:opacity-90 flex-shrink-0"
                style={{ background: `${phaseColor}25`, border: `1px solid ${phaseColor}40`, color: phaseColor }}
              >
                <Volume2 size={10} /> Try again
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 px-3 md:px-5 py-3 border-t border-amber-900/20"
          style={{ background: "rgba(10,6,2,0.7)" }}>

          {/* Recording state display */}
          {recordingState !== "idle" && !showTypeMode && (
            <div className="mb-2.5 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: `${phaseColor}12`, border: `1px solid ${phaseColor}25` }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: recordingState === "recording" ? "#e55" : phaseColor }} />
                <span className="text-[10px] font-sans" style={{ color: `${phaseColor}cc` }}>
                  {recordingState === "recording" ? "Recording" : recordingState === "paused" ? "Paused" : "Stopped"}
                </span>
                <RecordingWave active={recordingState === "recording"} analyserRef={analyserRef} />
              </div>
              <div className="flex items-center gap-1.5">
                {recordingState === "recording" && (
                  <button onClick={pauseRecording}
                    className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                    title="Pause recording"
                    style={{ color: phaseColor }}>
                    <Pause size={12} />
                  </button>
                )}
                {recordingState === "paused" && (
                  <button onClick={resumeRecording}
                    className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                    title="Resume recording"
                    style={{ color: phaseColor }}>
                    <Play size={12} />
                  </button>
                )}
                {(recordingState === "recording" || recordingState === "paused") && (
                  <button onClick={stopRecording}
                    className="p-1.5 rounded-lg transition-all hover:bg-white/10 text-red-500/70"
                    title="Stop recording">
                    <Square size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Live transcript / type input */}
          {(currentAnswer || showTypeMode || recordingState === "stopped") && (
            <div className="mb-2.5 relative">
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => {
                  setCurrentAnswer(e.target.value);
                  setAccumulatedTranscript(e.target.value);
                }}
                placeholder={recordingState === "recording" ? "Speaking — transcript appears here…" : "Type or speak your answer…"}
                className="w-full rounded-xl px-4 py-3 text-sm font-sans text-amber-200 placeholder-amber-900/40 resize-none focus:outline-none focus:ring-1"
                style={{
                  background: "rgba(20,12,4,0.8)",
                  border: `1px solid ${hasAnswer ? phaseColor + "40" : "rgba(90,52,20,0.3)"}`,

                  minHeight: "72px",
                  maxHeight: "160px",
                }}
                rows={3}
              />
              {recordingState === "recording" && (
                <div className="absolute bottom-2 right-3">
                  <RecordingWave active={true} analyserRef={analyserRef} />
                </div>
              )}
            </div>
          )}

          {/* ── After stop: prominent Submit / Re-record row ── */}
          {recordingState === "stopped" && !showTypeMode && currentAnswer.trim() && (
            <div className="flex items-center gap-2 mb-2.5">
              {/* Re-record — clears and starts fresh */}
              <button
                onClick={() => {
                  setCurrentAnswer("");
                  setAccumulatedTranscript("");
                  finalTextRef.current = "";
                  startRecording();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold flex-1 justify-center transition-all hover:opacity-90"
                style={{ background: "rgba(40,24,8,0.7)", border: `1px solid ${phaseColor}40`, color: `${phaseColor}cc` }}
              >
                <RotateCcw size={12} /> Re-record
              </button>

              {/* Submit — saves the answer */}
              <button
                onClick={saveAnswer}
                disabled={!canSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans text-xs font-semibold flex-1 justify-center transition-all disabled:opacity-40"
                style={{
                  background: canSave ? `linear-gradient(135deg, ${phaseColor}, #c8843a)` : "rgba(40,24,8,0.5)",
                  color: canSave ? "rgba(255,240,210,0.95)" : "rgba(120,80,30,0.5)",
                  boxShadow: canSave ? `0 2px 16px ${phaseColor}40` : "none",
                }}
              >
                <Send size={13} /> Submit Answer
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Voice controls — hide when stopped (Submit/Re-record row handles that) */}
            {!showTypeMode && recordingState !== "stopped" && (
              <>
                {recordingState === "idle" ? (
                  <button
                    onClick={startRecording}
                    disabled={isLoadingQuestion}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all disabled:opacity-40"
                    style={{ background: `${phaseColor}25`, border: `1px solid ${phaseColor}40`, color: phaseColor }}
                  >
                    <Mic size={13} /> Record answer
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {recordingState === "recording" ? (
                      <button onClick={pauseRecording}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-sans text-xs border transition-all"
                        style={{ background: `${phaseColor}20`, borderColor: `${phaseColor}40`, color: phaseColor }}>
                        <Pause size={12} /> Pause
                      </button>
                    ) : (
                      <button onClick={resumeRecording}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-sans text-xs border transition-all"
                        style={{ background: `${phaseColor}20`, borderColor: `${phaseColor}40`, color: phaseColor }}>
                        <Play size={12} /> Resume
                      </button>
                    )}
                    <button onClick={stopRecording}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-sans text-xs border border-red-800/40 text-red-500/70 hover:text-red-400 transition-all">
                      <MicOff size={12} /> Stop
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Re-record small button when stopped but no text yet */}
            {!showTypeMode && recordingState === "stopped" && !currentAnswer.trim() && (
              <button onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all"
                style={{ background: `${phaseColor}25`, border: `1px solid ${phaseColor}40`, color: phaseColor }}>
                <Mic size={13} /> Record answer
              </button>
            )}

            {/* Toggle type mode */}
            <button
              onClick={() => setShowTypeMode(!showTypeMode)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-sans text-xs border border-amber-900/20 text-amber-800/50 hover:text-amber-600 hover:border-amber-800/40 transition-all"
            >
              <Edit3 size={11} />
              {showTypeMode ? "Use voice" : "Type instead"}
            </button>

            <div className="flex-1" />

            {/* Save button — shown for typed answers or when not in stopped state */}
            {(showTypeMode || recordingState !== "stopped") && (
              <button
                onClick={saveAnswer}
                disabled={!canSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canSave ? `linear-gradient(135deg, ${phaseColor}, #c8843a)` : "rgba(40,24,8,0.5)",
                  color: canSave ? "rgba(255,240,210,0.95)" : "rgba(120,80,30,0.5)",
                  boxShadow: canSave ? `0 2px 12px ${phaseColor}30` : "none",
                }}
              >
                <Send size={13} />
                {showTypeMode ? "Submit Answer" : "Save answer"}
              </button>
            )}
          </div>

          {/* Hints */}
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-[9px] font-sans text-amber-900/40">
              {recordingState === "stopped" ? "Choose to submit or re-record your response" : "Enter to save · Shift+Enter for newline"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel: Memories (desktop only) ── */}
      <div
        className="hidden md:flex flex-shrink-0 flex-col border-l border-amber-900/20 transition-all duration-300"
        style={{ width: memoriesOpen ? "260px" : "36px" }}
      >
        <button
          onClick={() => setMemoriesOpen(!memoriesOpen)}
          className="flex items-center justify-between px-3 py-2.5 border-b border-amber-900/20 w-full"
          style={{ background: "rgba(10,6,2,0.5)" }}
        >
          {memoriesOpen ? (
            <>
              <div className="flex items-center gap-2">
                <Sparkles size={11} className="text-amber-600/60" />
                <span className="text-[10px] font-sans text-amber-600/60 uppercase tracking-wider">Memories</span>
              </div>
              <ChevronRight size={11} className="text-amber-800/40" />
            </>
          ) : (
            <Sparkles size={12} className="text-amber-700/50 mx-auto" />
          )}
        </button>

        {memoriesOpen && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {exchanges.length === 0 ? (
              <div className="text-center py-8 px-2">
                <Sparkles size={20} className="text-amber-800/30 mx-auto mb-2" />
                <p className="text-[10px] font-sans text-amber-800/40 leading-relaxed">
                  Memories will appear here as you share your story.
                </p>
              </div>
            ) : (
              [...exchanges].reverse().map((ex) => (
                ex.memory ? (
                  <MemoryCard key={ex.id} memory={ex.memory} />
                ) : ex.extracting ? (
                  <div key={ex.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-900/20">
                    <Loader2 size={10} className="text-amber-700/50 animate-spin" />
                    <span className="text-[9px] font-sans text-amber-800/50">Extracting…</span>
                  </div>
                ) : null
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen text-amber-700/50 font-serif">
        <Loader2 size={24} className="animate-spin mr-3" />
        Loading interview…
      </div>
    }>
      <InterviewInner />
    </Suspense>
  );
}
