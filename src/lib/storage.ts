/**
 * Persistence layer: writes to localStorage (always) + Supabase (when authenticated).
 */

import { PhaseId } from "./interview-config";
import { supabase as _supabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _supabase as any;

export interface StoredSession {
  id: string;
  interviewerId: string;
  interviewerName: string;
  startedAt: string;
  completedAt?: string;
  title?: string;
  summary?: StoredSessionSummary;
  exchangeCount: number;
  userName?: string;
}

export interface StoredSessionSummary {
  title: string;
  summary: string;
  keyPeople: string[];
  keyPlaces: string[];
  keyEvents: string[];
  lifeLessons: string[];
  timelineDates: { year?: number; description: string }[];
  memorableQuotes: string[];
  suggestedFollowUps: string[];
}

export interface StoredExchange {
  id: string;
  sessionId: string;
  phase: PhaseId;
  question: string;
  answer: string;
  memory?: StoredMemory;
  savedAt: string;
}

export interface StoredMemory {
  summary: string;
  emotionalTone: string;
  importantPeople: { name: string; relationship: string }[];
  importantPlaces: { name: string; type: string }[];
  approximateDates: { description: string; year?: number; period?: string }[];
  lifeEvent: string;
  lifeLesson: string;
  memorableQuotes: string[];
  followUpQuestions: string[];
  timelinePlacement: string;
  phase: PhaseId;
}

/* ─── Generic helpers ─────────────────────────────────────────────────── */
function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function getUserId(): Promise<string | null> {
  const { data } = await db.auth.getSession();
  return data.session?.user?.id ?? null;
}

/* ─── Sessions ────────────────────────────────────────────────────────── */
const SESSIONS_KEY = "ls_sessions";

export function getSessions(): StoredSession[] {
  return load<StoredSession>(SESSIONS_KEY).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function getSession(id: string): StoredSession | undefined {
  return getSessions().find((s) => s.id === id);
}

export async function createSession(interviewerId: string, interviewerName: string): Promise<StoredSession> {
  const session: StoredSession = {
    id: uid(),
    interviewerId,
    interviewerName,
    startedAt: new Date().toISOString(),
    exchangeCount: 0,
  };
  const sessions = getSessions();
  save(SESSIONS_KEY, [session, ...sessions]);

  const userId = await getUserId();
  if (userId) {
    await db.from("interview_sessions").insert({
      id: session.id,
      user_id: userId,
      interviewer_id: session.interviewerId,
      interviewer_name: session.interviewerName,
      started_at: session.startedAt,
      exchange_count: 0,
    });
  }

  return session;
}

export async function updateSession(id: string, updates: Partial<StoredSession>): Promise<void> {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...updates };
    save(SESSIONS_KEY, sessions);
  }

  const userId = await getUserId();
  if (userId) {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.exchangeCount !== undefined) dbUpdates.exchange_count = updates.exchangeCount;
    if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
    if (Object.keys(dbUpdates).length > 0) {
      await db.from("interview_sessions").update(dbUpdates).eq("id", id);
    }
  }
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  save(SESSIONS_KEY, sessions);
  const exchanges = getExchanges().filter((e) => e.sessionId !== id);
  save(EXCHANGES_KEY, exchanges);
}

/* ─── Exchanges ───────────────────────────────────────────────────────── */
const EXCHANGES_KEY = "ls_exchanges";

export function getExchanges(sessionId?: string): StoredExchange[] {
  const all = load<StoredExchange>(EXCHANGES_KEY);
  return sessionId ? all.filter((e) => e.sessionId === sessionId) : all;
}

export async function saveExchange(
  sessionId: string,
  phase: PhaseId,
  question: string,
  answer: string
): Promise<StoredExchange> {
  const exchange: StoredExchange = {
    id: uid(),
    sessionId,
    phase,
    question,
    answer,
    savedAt: new Date().toISOString(),
  };
  const exchanges = load<StoredExchange>(EXCHANGES_KEY);
  save(EXCHANGES_KEY, [...exchanges, exchange]);

  const sessions = getSessions();
  const sIdx = sessions.findIndex((s) => s.id === sessionId);
  if (sIdx >= 0) {
    sessions[sIdx].exchangeCount = (sessions[sIdx].exchangeCount || 0) + 1;
    save(SESSIONS_KEY, sessions);
  }

  const userId = await getUserId();
  if (userId) {
    await db.from("interview_exchanges").insert({
      id: exchange.id,
      session_id: exchange.sessionId,
      user_id: userId,
      phase: exchange.phase,
      question: exchange.question,
      answer: exchange.answer,
      saved_at: exchange.savedAt,
    });
    await db.from("interview_sessions")
      .update({ exchange_count: (sessions[sIdx]?.exchangeCount ?? 1) })
      .eq("id", sessionId);
  }

  return exchange;
}

export async function updateExchange(id: string, updates: Partial<StoredExchange>): Promise<void> {
  const exchanges = load<StoredExchange>(EXCHANGES_KEY);
  const idx = exchanges.findIndex((e) => e.id === id);
  if (idx >= 0) {
    exchanges[idx] = { ...exchanges[idx], ...updates };
    save(EXCHANGES_KEY, exchanges);
  }

  const userId = await getUserId();
  if (userId && updates.memory !== undefined) {
    await db.from("interview_exchanges")
      .update({ memory: updates.memory as unknown })
      .eq("id", id);
  }
}

/* ─── Derived data for app sections ──────────────────────────────────── */

export interface DerivedPerson {
  name: string;
  relationship: string;
  mentions: number;
  sessionIds: string[];
  quotes: string[];
}

export interface DerivedPlace {
  name: string;
  type: string;
  mentions: number;
  sessionIds: string[];
}

export interface DerivedLesson {
  lesson: string;
  phase: PhaseId;
  sessionId: string;
  savedAt: string;
}

export interface DerivedTimelineEvent {
  description: string;
  year?: number;
  period?: string;
  sessionId: string;
  phase: PhaseId;
  savedAt: string;
}

export function getAllPeople(): DerivedPerson[] {
  const exchanges = getExchanges();
  const map = new Map<string, DerivedPerson>();

  for (const ex of exchanges) {
    if (!ex.memory) continue;
    for (const p of ex.memory.importantPeople) {
      const key = p.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.mentions++;
        if (!existing.sessionIds.includes(ex.sessionId)) existing.sessionIds.push(ex.sessionId);
        const quotes = ex.memory.memorableQuotes.filter((q) =>
          q.toLowerCase().includes(p.name.toLowerCase())
        );
        existing.quotes.push(...quotes);
      } else {
        map.set(key, {
          name: p.name,
          relationship: p.relationship,
          mentions: 1,
          sessionIds: [ex.sessionId],
          quotes: [],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.mentions - a.mentions);
}

export function getAllPlaces(): DerivedPlace[] {
  const exchanges = getExchanges();
  const map = new Map<string, DerivedPlace>();

  for (const ex of exchanges) {
    if (!ex.memory) continue;
    for (const p of ex.memory.importantPlaces) {
      const key = p.name.toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.mentions++;
        if (!existing.sessionIds.includes(ex.sessionId)) existing.sessionIds.push(ex.sessionId);
      } else {
        map.set(key, {
          name: p.name,
          type: p.type,
          mentions: 1,
          sessionIds: [ex.sessionId],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.mentions - a.mentions);
}

export function getAllLessons(): DerivedLesson[] {
  const exchanges = getExchanges();
  return exchanges
    .filter((ex) => ex.memory?.lifeLesson && ex.memory.lifeLesson.trim())
    .map((ex) => ({
      lesson: ex.memory!.lifeLesson,
      phase: ex.phase,
      sessionId: ex.sessionId,
      savedAt: ex.savedAt,
    }));
}

export function getAllTimelineEvents(): DerivedTimelineEvent[] {
  const exchanges = getExchanges();
  const events: DerivedTimelineEvent[] = [];

  for (const ex of exchanges) {
    if (!ex.memory) continue;
    for (const d of ex.memory.approximateDates) {
      events.push({
        description: d.description,
        year: d.year,
        period: d.period,
        sessionId: ex.sessionId,
        phase: ex.phase,
        savedAt: ex.savedAt,
      });
    }
  }

  return events.sort((a, b) => (a.year || 9999) - (b.year || 9999));
}

export function getAllQuotes(): { quote: string; phase: PhaseId; sessionId: string; savedAt: string }[] {
  const exchanges = getExchanges();
  const quotes: { quote: string; phase: PhaseId; sessionId: string; savedAt: string }[] = [];

  for (const ex of exchanges) {
    if (!ex.memory?.memorableQuotes) continue;
    for (const q of ex.memory.memorableQuotes) {
      if (q.trim()) quotes.push({ quote: q, phase: ex.phase, sessionId: ex.sessionId, savedAt: ex.savedAt });
    }
  }

  return quotes;
}

export function getProfileTranscripts(): string[] {
  const sessions = getSessions();
  const exchanges = getExchanges();

  return sessions.map((s) => {
    const sessionExchanges = exchanges.filter((e) => e.sessionId === s.id);
    if (!sessionExchanges.length) return "";
    return [
      `=== Session: ${s.title || "Interview"} (${new Date(s.startedAt).toLocaleDateString()}) ===`,
      `Interviewer: ${s.interviewerName}`,
      "",
      ...sessionExchanges.map(
        (e) => `Q: ${e.question}\nA: ${e.answer}`
      ),
    ].join("\n");
  }).filter(Boolean);
}

export function getStats() {
  const sessions = getSessions();
  const exchanges = getExchanges();
  const people = getAllPeople();
  const places = getAllPlaces();
  const lessons = getAllLessons();
  const events = getAllTimelineEvents();
  const quotes = getAllQuotes();

  return {
    sessionCount: sessions.length,
    completedSessions: sessions.filter((s) => s.completedAt).length,
    exchangeCount: exchanges.length,
    wordCount: exchanges.reduce((sum, e) => sum + e.answer.split(/\s+/).length, 0),
    peopleCount: people.length,
    placesCount: places.length,
    lessonsCount: lessons.length,
    eventsCount: events.length,
    quotesCount: quotes.length,
  };
}

