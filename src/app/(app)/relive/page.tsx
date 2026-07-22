"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getSessions, getExchanges, StoredSession } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import {
  Upload, Sparkles, Download, RefreshCw, ChevronRight, ChevronLeft,
  ImageIcon, X, Check, Loader2, Crown, Zap, Mic, Square, Wand2
} from "lucide-react";

interface RefineResult {
  cleanedStory: string;
  questions: string[];
  panelMoments: { n: number; moment: string }[];
}

type AgeStage =
  | "Child (ages 5-12)" | "Teenager (ages 13-17)" | "Young Adult (ages 18-29)"
  | "Adult (ages 30-45)" | "Middle Age (ages 46-60)" | "Elder (ages 61+)";

type ArtStyle =
  | "Illustrated Memoir" | "Graphic Novel" | "Historical Documentary"
  | "Warm Family Storybook" | "Cinematic Concept Art";

type Tier = "free" | "premium";

const AGE_STAGES: { id: AgeStage; emoji: string; desc: string }[] = [
  { id: "Child (ages 5-12)", emoji: "ðŸ§’", desc: "Early childhood and wonder" },
  { id: "Teenager (ages 13-17)", emoji: "ðŸ§‘", desc: "Coming of age" },
  { id: "Young Adult (ages 18-29)", emoji: "ðŸ™‹", desc: "Finding your path" },
  { id: "Adult (ages 30-45)", emoji: "ðŸ‘¤", desc: "Building & belonging" },
  { id: "Middle Age (ages 46-60)", emoji: "ðŸ§‘â€ðŸ’¼", desc: "Peak wisdom & legacy" },
  { id: "Elder (ages 61+)", emoji: "ðŸ§“", desc: "Reflection & heritage" },
];

const ART_STYLES: { id: ArtStyle; preview: string; desc: string }[] = [
  { id: "Illustrated Memoir", preview: "ðŸŽ¨", desc: "Watercolor & ink, soft textures, literary warmth" },
  { id: "Graphic Novel", preview: "ðŸ“˜", desc: "Bold lines, high contrast, dynamic panels" },
  { id: "Historical Documentary", preview: "ðŸ“œ", desc: "Sepia & gold tones, archival aesthetic" },
  { id: "Warm Family Storybook", preview: "ðŸ“–", desc: "Pastel palette, cozy and inviting" },
  { id: "Cinematic Concept Art", preview: "ðŸŽ¬", desc: "Dramatic lighting, filmic composition" },
];

const PANEL_COUNTS = [12, 14, 16] as const;

const RELIVE_EXAMPLES = [
  { id: "lost",  title: "Lost",                  subtitle: "A Boy's Unexpected Adventure",      src: "/examples/lost.jpg" },
  { id: "bully", title: "The Bully",              subtitle: "How Sammy Let His Actions Speak",   src: "/examples/bully.jpg" },
  { id: "stage", title: "Passion for the Stage",  subtitle: "From the Background to Spotlight",  src: "/examples/stage.jpg" },
];

interface SSEEvent {
  type: "progress" | "panel_done" | "complete" | "error";
  message?: string;
  step?: number;
  total?: number;
  panelNumber?: number;
  imageUrl?: string;
  imageB64?: string;
  title?: string;
  subtitle?: string;
  storyboardId?: string;
}

export default function RelivePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [manualStory, setManualStory] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [ageStage, setAgeStage] = useState<AgeStage>("Adult (ages 30-45)");
  const [artStyle, setArtStyle] = useState<ArtStyle>("Cinematic Concept Art");
  const [panelCount, setPanelCount] = useState<12 | 14 | 16>(12);
  const [tier, setTier] = useState<Tier>("premium");
  const [lightbox, setLightbox] = useState<typeof RELIVE_EXAMPLES[0] | null>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef("");

  // AI refinement
  const [refining, setRefining] = useState(false);
  const [refineResult, setRefineResult] = useState<RefineResult | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [answeringIdx, setAnsweringIdx] = useState<number | null>(null);
  const [answerRecording, setAnswerRecording] = useState(false);
  const answerRecRef = useRef<any>(null);

  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [panelsDone, setPanelsDone] = useState(0);
  const [totalPanels, setTotalPanels] = useState(0);
  const [result, setResult] = useState<SSEEvent | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Past storyboards
  interface PastStoryboard {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    panel_count: number;
    art_style: string;
    created_at: string;
  }
  const [pastBoards, setPastBoards] = useState<PastStoryboard[]>([]);
  const [pastLightbox, setPastLightbox] = useState<PastStoryboard | null>(null);

  useEffect(() => { setSessions(getSessions()); }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any)
        .from("relive_storyboards")
        .select("id, title, subtitle, image_url, panel_count, art_style, created_at")
        .eq("user_id", session.user.id)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setPastBoards(data);
    })();
  }, [result]); // re-fetch after a new generation completes

  const getStoryContent = useCallback((): string => {
    if (selectedSessionId) {
      const exchanges = getExchanges(selectedSessionId);
      return exchanges.map((e) => `Q: ${e.question}\nA: ${e.answer}`).join("\n\n");
    }
    return manualStory;
  }, [selectedSessionId, manualStory]);

  // â”€â”€ Voice recording for story textarea â”€â”€
  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    finalTextRef.current = manualStory;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTextRef.current = (finalTextRef.current + " " + t).trimStart();
        } else {
          interim += t;
        }
      }
      setManualStory(interim ? finalTextRef.current + " " + interim : finalTextRef.current);
      setSelectedSessionId(null);
    };
    r.onend = () => {
      setManualStory(finalTextRef.current.trim());
      setRecording(false);
    };
    recognitionRef.current = r;
    r.start();
    setRecording(true);
  }, [manualStory]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  // â”€â”€ Voice recording for question answers â”€â”€
  const startAnswerRecording = useCallback((idx: number) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const prev = questionAnswers[idx] ?? "";
    let accumulated = prev;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulated = (accumulated + " " + t).trimStart();
        else interim += t;
      }
      setQuestionAnswers((qa) => { const next = [...qa]; next[idx] = interim ? accumulated + " " + interim : accumulated; return next; });
    };
    r.onend = () => {
      setQuestionAnswers((qa) => { const next = [...qa]; next[idx] = accumulated.trim(); return next; });
      setAnswerRecording(false);
    };
    answerRecRef.current = r;
    r.start();
    setAnsweringIdx(idx);
    setAnswerRecording(true);
  }, [questionAnswers]);

  const stopAnswerRecording = useCallback(() => {
    answerRecRef.current?.stop();
    setAnswerRecording(false);
  }, []);

  // â”€â”€ AI refinement â”€â”€
  const handleRefine = useCallback(async () => {
    const raw = getStoryContent();
    if (raw.trim().length < 20) return;
    setRefining(true);
    setRefineResult(null);
    setQuestionAnswers([]);
    try {
      const res = await fetch("/api/relive/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawStory: raw, subjectName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRefineResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefining(false);
    }
  }, [getStoryContent, subjectName]);

  // Merge cleaned story + question answers into manualStory before advancing
  const applyRefinement = useCallback(() => {
    if (!refineResult) return;
    const answered = refineResult.questions
      .map((q, i) => questionAnswers[i]?.trim() ? `${q}\n${questionAnswers[i].trim()}` : "")
      .filter(Boolean)
      .join("\n\n");
    const merged = refineResult.cleanedStory + (answered ? "\n\nAdditional context:\n" + answered : "");
    setManualStory(merged);
    setSelectedSessionId(null);
    setRefineResult(null);
    setStep(2);
  }, [refineResult, questionAnswers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setReferenceImage(r);
      setReferencePreview(r);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const storyContent = getStoryContent();
    if (storyContent.trim().length < 50) {
      setError("Please provide more story content (at least a few sentences).");
      return;
    }
    setError("");
    setGenerating(true);
    setProgressMsg(tier === "premium" ? "Starting premium generationâ€¦" : "Starting generationâ€¦");
    setPanelsDone(0);
    setTotalPanels(panelCount);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;

      const response = await fetch("/api/relive/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          storyContent,
          subjectName,
          referenceImageBase64: referenceImage,
          ageStage,
          artStyle,
          panelCount,
          sessionId: selectedSessionId,
          tier,
        }),
      });

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: SSEEvent = JSON.parse(line.slice(6));
            if (event.type === "progress") {
              setProgressMsg(event.message ?? "");
            } else if (event.type === "panel_done") {
              setPanelsDone((n) => n + 1);
              setProgressMsg(`Panel ${event.panelNumber} of ${event.total} completeâ€¦`);
            } else if (event.type === "complete") {
              setResult(event);
              setStep(4);
              setGenerating(false);
            } else if (event.type === "error") {
              throw new Error(event.message ?? "Generation failed");
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const src = result?.imageUrl ?? (result?.imageB64 ? `data:image/jpeg;base64,${result.imageB64}` : null);
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `${result?.title || "relive-storyboard"}.jpg`;
    a.click();
  };

  const storyContent = getStoryContent();
  const hasStory = storyContent.trim().length >= 50;
  const progressPct = totalPanels > 0 ? Math.round((panelsDone / totalPanels) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8">

      {/* â”€â”€ Lightbox â”€â”€ */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(4,2,0,0.97)" }}
          onClick={() => setLightbox(null)}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="font-serif font-bold text-amber-200 text-lg leading-tight">{lightbox.title}</div>
              <div className="font-serif italic text-xs mt-0.5" style={{ color: "rgba(190,145,70,0.75)" }}>{lightbox.subtitle}</div>
            </div>
            <button onClick={() => setLightbox(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 text-xl"
              style={{ background: "rgba(40,20,5,0.8)", border: "1px solid rgba(100,60,20,0.4)" }}>Ã—</button>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-4" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.title} className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)" }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-amber-200">Re-Live</h1>
            <p className="text-xs font-sans text-amber-700/60">Transform memories into an illustrated storyboard</p>
          </div>
        </div>

        {step < 4 && (
          <div className="flex items-center gap-2 mt-4">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-serif font-bold transition-all"
                  style={{
                    background: step >= s ? "linear-gradient(135deg, #7a2d8a, #c84a9a)" : "rgba(18,11,4,0.7)",
                    border: step >= s ? "none" : "1px solid rgba(101,67,20,0.3)",
                    color: step >= s ? "white" : "rgba(146,96,10,0.5)",
                  }}>
                  {step > s ? <Check size={12} /> : s}
                </div>
                <span className="text-xs font-sans hidden md:block"
                  style={{ color: step >= s ? "#d4a017" : "rgba(146,96,10,0.4)" }}>
                  {s === 1 ? "Your Story" : s === 2 ? "Reference Photo" : "Style & Generate"}
                </span>
                {s < 3 && <ChevronRight size={12} className="text-amber-900/40" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ Past storyboard lightbox â”€â”€ */}
      {pastLightbox && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(4,2,0,0.97)" }}
          onClick={() => setPastLightbox(null)}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="font-serif font-bold text-amber-200 text-lg leading-tight">{pastLightbox.title}</div>
              <div className="font-serif italic text-xs mt-0.5" style={{ color: "rgba(190,145,70,0.75)" }}>
                {pastLightbox.subtitle} Â· {new Date(pastLightbox.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={pastLightbox.image_url} download={`${pastLightbox.title}.jpg`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold"
                style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
                <Download size={12} /> Download
              </a>
              <button onClick={() => setPastLightbox(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-amber-600 text-xl"
                style={{ background: "rgba(40,20,5,0.8)", border: "1px solid rgba(100,60,20,0.4)" }}>Ã—</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto px-2 pb-6" onClick={(e) => e.stopPropagation()}>
            <img src={pastLightbox.image_url} alt={pastLightbox.title} className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* â”€â”€ Your past storyboards (step 1 only) â”€â”€ */}
      {step === 1 && pastBoards.length > 0 && (
        <div className="mb-6">
          <p className="text-[11px] font-sans uppercase tracking-widest mb-3" style={{ color: "rgba(190,145,70,0.7)" }}>
            âœ¦ Your storyboards â€” tap to view
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {pastBoards.map((board) => (
              <button key={board.id} onClick={() => setPastLightbox(board)}
                className="flex-shrink-0 relative rounded-xl overflow-hidden text-left transition-all hover:scale-105"
                style={{ width: 220, height: 148, border: "1px solid rgba(180,130,50,0.35)" }}>
                <img src={board.image_url} alt={board.title} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(4,2,0,0.93) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <div className="font-serif font-bold text-amber-200 text-xs leading-tight">{board.title}</div>
                  <div className="font-sans text-[9px] mt-0.5" style={{ color: "rgba(180,140,80,0.8)" }}>
                    {new Date(board.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} Â· {board.panel_count} panels
                  </div>
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-sans"
                  style={{ background: "rgba(60,35,5,0.85)", color: "rgba(220,175,90,0.9)" }}>View</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ Example storyboards (step 1 only) â”€â”€ */}
      {step === 1 && (
        <div className="mb-6">
          <p className="text-[11px] font-sans uppercase tracking-widest mb-3" style={{ color: "rgba(150,100,180,0.7)" }}>
            âœ¦ Example Re-Live storyboards â€” tap to explore
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {RELIVE_EXAMPLES.map((story) => (
              <button key={story.id} onClick={() => setLightbox(story)}
                className="flex-shrink-0 relative rounded-xl overflow-hidden text-left transition-all hover:scale-105"
                style={{ width: 220, height: 148, border: "1px solid rgba(120,50,150,0.4)" }}>
                <img src={story.src} alt={story.title} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(4,1,8,0.93) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                  <div className="font-serif font-bold text-amber-200 text-xs leading-tight">{story.title}</div>
                  <div className="font-sans text-[9px] mt-0.5 leading-tight" style={{ color: "rgba(180,130,200,0.8)" }}>{story.subtitle}</div>
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-sans"
                  style={{ background: "rgba(80,20,100,0.8)", color: "rgba(220,180,255,0.9)" }}>View</div>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* â”€â”€ Step 1: Story â”€â”€ */}
      {step === 1 && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-serif text-amber-200 mb-1">Choose your story</h2>
          <p className="text-sm font-sans text-amber-700/60 mb-5">Select an interview session or write a story directly.</p>

          <div className="mb-4">
            <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70 block mb-2">Subject's name (optional)</label>
            <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Margaret, Grandpa Joe, Momâ€¦"
              className="w-full rounded-xl px-4 py-3 text-sm font-sans text-amber-200 placeholder-amber-800/40 focus:outline-none focus:ring-1 focus:ring-purple-700/50"
              style={{ background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.35)" }} />
          </div>

          {sessions.filter(s => getExchanges(s.id).length > 0).length > 0 && (
            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70 block mb-2">Use an interview session</label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {sessions.filter(s => getExchanges(s.id).length > 0).map((s) => {
                  const exchanges = getExchanges(s.id);
                  return (
                    <button key={s.id} onClick={() => { setSelectedSessionId(s.id); setManualStory(""); }}
                      className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all"
                      style={{
                        background: selectedSessionId === s.id ? "rgba(122,45,138,0.25)" : "rgba(18,11,4,0.7)",
                        border: selectedSessionId === s.id ? "1px solid rgba(200,74,154,0.4)" : "1px solid rgba(101,67,20,0.25)",
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)" }}>
                        {s.interviewerName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif text-amber-200 truncate">{s.title || `Session with ${s.interviewerName.split(" ")[0]}`}</div>
                        <div className="text-[10px] font-sans text-amber-800/50">{exchanges.length} exchanges Â· {new Date(s.startedAt).toLocaleDateString()}</div>
                      </div>
                      {selectedSessionId === s.id && <Check size={14} style={{ color: "#c84a9a" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70">
                {sessions.length > 0 ? "Or write a story directly" : "Write the story"}
              </label>
              {/* Mic toggle */}
              {!selectedSessionId && (
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all"
                  style={{
                    background: recording ? "rgba(200,30,60,0.2)" : "rgba(122,45,138,0.2)",
                    border: `1px solid ${recording ? "rgba(200,30,60,0.4)" : "rgba(200,74,154,0.35)"}`,
                    color: recording ? "rgba(255,100,120,0.9)" : "rgba(200,74,154,0.9)",
                  }}
                >
                  {recording ? <><Square size={10} /> Stop</> : <><Mic size={11} /> Speak your story</>}
                </button>
              )}
            </div>
            {recording && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg"
                style={{ background: "rgba(200,30,60,0.1)", border: "1px solid rgba(200,30,60,0.25)" }}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-sans" style={{ color: "rgba(255,120,140,0.9)" }}>Listening â€” speak your storyâ€¦</span>
              </div>
            )}
            <textarea value={manualStory}
              onChange={(e) => { setManualStory(e.target.value); setSelectedSessionId(null); setRefineResult(null); }}
              placeholder="Describe the memories, life events, places, people, and moments you want illustratedâ€¦ or press 'Speak your story' above."
              rows={7}
              className="w-full rounded-xl px-4 py-3 text-sm font-sans text-amber-200 placeholder-amber-800/40 resize-none focus:outline-none focus:ring-1 focus:ring-purple-700/50"
              style={{ background: "rgba(15,10,4,0.8)", border: "1px solid rgba(101,67,20,0.35)" }} />
            <div className="flex items-center justify-between mt-1">
              <div className="text-[10px] font-sans" style={{ color: "rgba(146,96,10,0.4)" }}>
                {storyContent.trim().length} chars {hasStory ? <span style={{ color: "#c84a9a" }}>âœ“</span> : "(min 50)"}
              </div>
              {/* Refine button */}
              {!selectedSessionId && storyContent.trim().length >= 20 && (
                <button onClick={handleRefine} disabled={refining}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,rgba(122,45,138,0.35),rgba(200,74,154,0.25))", border: "1px solid rgba(200,74,154,0.4)", color: "rgba(220,160,240,0.95)" }}>
                  {refining ? <><Loader2 size={11} className="animate-spin" /> Refiningâ€¦</> : <><Wand2 size={11} /> Refine with AI</>}
                </button>
              )}
            </div>
          </div>

          {/* â”€â”€ AI Refinement results â”€â”€ */}
          {refineResult && (
            <div className="mb-6 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(122,45,138,0.4)", background: "rgba(12,6,18,0.85)" }}>

              {/* Cleaned story */}
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "rgba(122,45,138,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} style={{ color: "#c84a9a" }} />
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider" style={{ color: "rgba(200,74,154,0.9)" }}>Refined story</span>
                </div>
                <p className="text-sm font-serif leading-relaxed text-amber-200/90">{refineResult.cleanedStory}</p>
              </div>

              {/* Clarifying questions */}
              {refineResult.questions.length > 0 && (
                <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(122,45,138,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-sans font-semibold uppercase tracking-wider" style={{ color: "rgba(200,74,154,0.9)" }}>A few questions to enrich the story</span>
                  </div>
                  <div className="space-y-3">
                    {refineResult.questions.map((q, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: "rgba(18,8,28,0.7)", border: "1px solid rgba(100,40,120,0.3)" }}>
                        <p className="text-xs font-serif text-amber-300/90 mb-2">{q}</p>
                        <div className="flex items-start gap-2">
                          <textarea
                            value={questionAnswers[i] ?? ""}
                            onChange={(e) => setQuestionAnswers((qa) => { const n = [...qa]; n[i] = e.target.value; return n; })}
                            placeholder="Type your answerâ€¦ or use the mic"
                            rows={2}
                            className="flex-1 rounded-lg px-3 py-2 text-xs font-sans text-amber-200 placeholder-amber-800/40 resize-none focus:outline-none focus:ring-1 focus:ring-purple-700/50"
                            style={{ background: "rgba(10,5,15,0.8)", border: "1px solid rgba(80,30,100,0.4)" }}
                          />
                          <button
                            onClick={() => answerRecording && answeringIdx === i ? stopAnswerRecording() : startAnswerRecording(i)}
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all mt-0.5"
                            style={{
                              background: answerRecording && answeringIdx === i ? "rgba(200,30,60,0.2)" : "rgba(122,45,138,0.2)",
                              border: `1px solid ${answerRecording && answeringIdx === i ? "rgba(200,30,60,0.4)" : "rgba(122,45,138,0.35)"}`,
                              color: answerRecording && answeringIdx === i ? "rgba(255,100,120,0.9)" : "rgba(200,74,154,0.8)",
                            }}>
                            {answerRecording && answeringIdx === i ? <Square size={10} /> : <Mic size={11} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel moment suggestions */}
              {refineResult.panelMoments.length > 0 && (
                <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(122,45,138,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon size={12} style={{ color: "#c84a9a" }} />
                    <span className="text-xs font-sans font-semibold uppercase tracking-wider" style={{ color: "rgba(200,74,154,0.9)" }}>Suggested visual panels</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {refineResult.panelMoments.map((p) => (
                      <div key={p.n} className="flex gap-2 px-2.5 py-2 rounded-lg"
                        style={{ background: "rgba(18,8,28,0.6)", border: "1px solid rgba(80,30,100,0.25)" }}>
                        <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold font-sans mt-0.5"
                          style={{ background: "rgba(122,45,138,0.7)", color: "white" }}>{p.n}</span>
                        <p className="text-[10px] font-serif leading-snug" style={{ color: "rgba(200,165,100,0.85)" }}>{p.moment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-3 flex gap-2">
                <button onClick={() => setRefineResult(null)}
                  className="px-4 py-2 rounded-xl font-sans text-xs border transition-all hover:opacity-80"
                  style={{ borderColor: "rgba(101,67,20,0.3)", color: "rgba(220,175,80,0.95)" }}>
                  Edit original
                </button>
                <button onClick={applyRefinement}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-serif text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)", color: "white" }}>
                  Use this story <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {!refineResult && (
            <button onClick={() => setStep(2)} disabled={!hasStory}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-serif text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: hasStory ? "linear-gradient(135deg, #7a2d8a, #c84a9a)" : "rgba(18,11,4,0.7)", color: "white" }}>
              Next: Reference Photo <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* â”€â”€ Step 2: Reference Photo â”€â”€ */}
      {step === 2 && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-serif text-amber-200 mb-1">Reference photo</h2>
          <p className="text-sm font-sans text-amber-700/60 mb-5">
            Upload a photo to guide character appearance across panels. Optional but recommended.
          </p>

          <div onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all mb-5 overflow-hidden"
            style={{ borderColor: referencePreview ? "rgba(200,74,154,0.5)" : "rgba(101,67,20,0.4)", background: "rgba(15,10,4,0.6)", minHeight: 200 }}>
            {referencePreview ? (
              <>
                <img src={referencePreview} alt="Reference" className="w-full h-56 object-cover rounded-2xl" />
                <button onClick={(e) => { e.stopPropagation(); setReferenceImage(null); setReferencePreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.7)" }}>
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 rounded-lg px-3 py-1.5 text-xs font-sans text-center"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  <span style={{ color: "#c84a9a" }}>âœ“ Photo uploaded</span>
                  <span className="text-amber-800/60 ml-1">â€” tap to change</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(122,45,138,0.2)", border: "1px solid rgba(200,74,154,0.3)" }}>
                  <Upload size={24} style={{ color: "#c84a9a" }} />
                </div>
                <div>
                  <div className="text-amber-200 font-serif text-sm font-semibold">Upload a reference photo</div>
                  <div className="text-amber-800/50 font-sans text-xs mt-1">JPG, PNG, WEBP â€” used as character guide only</div>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="rounded-xl px-4 py-3 mb-5 text-xs font-sans"
            style={{ background: "rgba(18,11,4,0.6)", border: "1px solid rgba(101,67,20,0.25)" }}>
            <p className="text-amber-700/80">AI creates an illustrated interpretation â€” not a photorealistic or biometric copy. Intended for personal storytelling and family history.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-serif text-sm text-amber-700 hover:text-amber-400 transition-all"
              style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-serif text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)", color: "white" }}>
              {referencePreview ? "Next: Style & Generate" : "Skip & Continue"} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Step 3: Style, Tier & Generate â”€â”€ */}
      {step === 3 && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-serif text-amber-200 mb-1">Choose your style</h2>
          <p className="text-sm font-sans text-amber-700/60 mb-5">Select artwork style and panel options.</p>

          {/* Early access banner */}
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(122,45,138,0.18)", border: "1px solid rgba(200,74,154,0.35)" }}>
            <Crown size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#e879c0" }} />
            <div>
              <div className="font-serif font-semibold text-sm" style={{ color: "#f0a0d8" }}>
                Premium Access â€” Complimentary until Aug 11
              </div>
              <div className="text-[11px] font-sans mt-0.5 leading-relaxed" style={{ color: "rgba(180,120,160,0.8)" }}>
                Each panel is individually generated at full resolution for maximum quality and character consistency. Early testers get this free â€” thank you for helping shape the experience.
              </div>
            </div>
          </div>

          {/* Age Stage */}
          <div className="mb-5">
            <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70 block mb-3">Age / Life Stage to Depict</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AGE_STAGES.map((a) => (
                <button key={a.id} onClick={() => setAgeStage(a.id)}
                  className="rounded-xl p-3 text-left transition-all"
                  style={{
                    background: ageStage === a.id ? "rgba(122,45,138,0.3)" : "rgba(18,11,4,0.7)",
                    border: ageStage === a.id ? "1px solid rgba(200,74,154,0.5)" : "1px solid rgba(101,67,20,0.25)",
                  }}>
                  <div className="text-lg mb-1">{a.emoji}</div>
                  <div className="text-xs font-serif font-semibold" style={{ color: ageStage === a.id ? "#e879c0" : "#d4a060" }}>
                    {a.id.split(" (")[0]}
                  </div>
                  <div className="text-[11px] font-sans mt-0.5" style={{ color: "rgba(180,140,80,0.75)" }}>{a.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual style â€” 3 options only */}
          <div className="mb-5">
            <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70 block mb-3">Visual Style</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "Cinematic Concept Art" as ArtStyle, emoji: "ðŸŽ¬", label: "Cinematic",   desc: "Dramatic, filmic, lifelike" },
                { id: "Illustrated Memoir"    as ArtStyle, emoji: "ðŸŽ¨", label: "Illustrated", desc: "Watercolor, warm textures" },
                { id: "Graphic Novel"         as ArtStyle, emoji: "ðŸ“˜", label: "Graphic",     desc: "Bold lines, high contrast" },
              ].map((s) => (
                <button key={s.id} onClick={() => setArtStyle(s.id)}
                  className="rounded-xl p-4 text-left transition-all"
                  style={{
                    background: artStyle === s.id ? "rgba(122,45,138,0.3)" : "rgba(18,11,4,0.7)",
                    border: artStyle === s.id ? "1px solid rgba(200,74,154,0.5)" : "1px solid rgba(101,67,20,0.25)",
                  }}>
                  <div className="text-2xl mb-2">{s.emoji}</div>
                  <div className="text-sm font-serif font-semibold mb-1" style={{ color: artStyle === s.id ? "#e879c0" : "#d4a060" }}>{s.label}</div>
                  <div className="text-xs font-sans" style={{ color: "rgba(180,140,80,0.75)" }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel Count â€” 12 or 16 only */}
          <div className="mb-6">
            <label className="text-xs uppercase tracking-wider font-serif text-amber-600/70 block mb-3">Number of Panels</label>
            <div className="flex gap-3">
              {([12, 16] as const).map((n) => (
                <button key={n} onClick={() => setPanelCount(n)}
                  className="flex-1 rounded-xl py-3 font-serif text-sm font-semibold transition-all"
                  style={{
                    background: panelCount === n ? "linear-gradient(135deg, #7a2d8a, #c84a9a)" : "rgba(18,11,4,0.7)",
                    border: panelCount === n ? "none" : "1px solid rgba(101,67,20,0.25)",
                    color: panelCount === n ? "white" : "#b8935a",
                  }}>
                  {n} panels
                </button>
              ))}
            </div>
            <p className="text-[11px] font-sans text-amber-800/40 mt-2 text-center">
              ~{Math.round(panelCount * 10 / 60)} min to generate Â· {panelCount} individual images composited
            </p>
          </div>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm font-sans text-red-400"
              style={{ background: "rgba(200,0,0,0.1)", border: "1px solid rgba(200,0,0,0.2)" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-serif text-sm text-amber-700 hover:text-amber-400 transition-all"
              style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={handleGenerate} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-serif text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)", color: "white" }}>
              {generating ? <><Loader2 size={16} className="animate-spin" /> Generatingâ€¦</> : <><Sparkles size={16} /> Generate Re-Live Storyboard</>}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Loading overlay â”€â”€ */}
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(8,5,2,0.94)", backdropFilter: "blur(8px)" }}>
          <div className="text-center max-w-sm px-6 w-full">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)" }}>
              {tier === "premium" ? <Crown size={32} className="text-white animate-pulse" /> : <Sparkles size={32} className="text-white animate-pulse" />}
            </div>

            <h3 className="text-xl font-serif font-bold text-amber-200 mb-2">
              {tier === "premium" ? "Creating Premium Storyboard" : "Creating Your Storyboard"}
            </h3>
            <p className="text-sm font-sans text-amber-700/70 mb-5 min-h-[40px]">{progressMsg}</p>

            {tier === "premium" && totalPanels > 0 && (
              <div className="mb-5">
                {/* Panel progress grid */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                  {Array.from({ length: totalPanels }).map((_, i) => (
                    <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-serif transition-all"
                      style={{
                        background: i < panelsDone ? "linear-gradient(135deg, #7a2d8a, #c84a9a)" : "rgba(50,20,10,0.8)",
                        border: i < panelsDone ? "none" : "1px solid rgba(101,67,20,0.3)",
                        color: i < panelsDone ? "white" : "rgba(146,96,10,0.4)",
                      }}>
                      {i < panelsDone ? <Check size={12} /> : i + 1}
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="w-full rounded-full h-1.5" style={{ background: "rgba(50,20,10,0.8)" }}>
                  <div className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7a2d8a, #c84a9a)" }} />
                </div>
                <p className="text-[11px] font-sans text-amber-800/40 mt-2">{panelsDone} of {totalPanels} panels complete</p>
              </div>
            )}

            {tier === "free" && (
              <div className="flex justify-center gap-1.5 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#c84a9a", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}

            <p className="text-[11px] font-sans text-amber-800/40">
              {tier === "premium" ? `~${Math.round(panelCount * 10 / 60)} minutes` : "About 90 seconds"} Â· Do not close this tab
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ Step 4: Result â”€â”€ */}
      {step === 4 && result && (
        <div className="max-w-5xl">
          <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-serif font-bold text-amber-200">{result.title}</h2>
                {tier === "premium" && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-sans"
                    style={{ background: "rgba(122,45,138,0.3)", color: "#e879c0", border: "1px solid rgba(200,74,154,0.3)" }}>
                    <Crown size={9} /> Premium
                  </span>
                )}
              </div>
              {result.subtitle && <p className="text-sm font-sans text-amber-700/60">{result.subtitle}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setResult(null); setStep(3); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-serif text-sm text-amber-600 hover:text-amber-400 transition-all"
                style={{ border: "1px solid rgba(101,67,20,0.35)" }}>
                <RefreshCw size={14} /> Regenerate
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-serif text-sm font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #7a2d8a, #c84a9a)", color: "white" }}>
                <Download size={14} /> Download
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(122,45,138,0.3)" }}>
            {result.imageUrl ? (
              <img src={result.imageUrl} alt={result.title} className="w-full" />
            ) : result.imageB64 ? (
              <img src={`data:image/jpeg;base64,${result.imageB64}`} alt={result.title} className="w-full" />
            ) : (
              <div className="flex items-center justify-center h-64 text-amber-800/40"><ImageIcon size={40} /></div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-sans text-amber-800/50">
            {[
              tier === "premium" ? "Premium Â· Individual panels" : "Standard",
              `${panelCount} panels`,
              artStyle,
              ageStage,
            ].map((tag) => (
              <span key={tag} className="px-2 py-1 rounded-full"
                style={{ background: "rgba(18,11,4,0.6)", border: "1px solid rgba(101,67,20,0.2)" }}>{tag}</span>
            ))}
          </div>

          <div className="mt-4 rounded-xl px-4 py-3 text-xs font-sans"
            style={{ background: "rgba(18,11,4,0.6)", border: "1px solid rgba(101,67,20,0.2)" }}>
            <p className="text-amber-700/60">
              <span className="text-amber-600">AI-generated illustration.</span>{" "}
              Artistic interpretation only â€” not a photorealistic or historically exact reconstruction.
              Intended for personal storytelling, family history, and memoir.
            </p>
          </div>

          <div className="mt-5">
            <button onClick={() => { setStep(1); setResult(null); setSelectedSessionId(null); setManualStory(""); setReferenceImage(null); setReferencePreview(null); setPanelsDone(0); }}
              className="px-5 py-2.5 rounded-xl font-serif text-sm text-amber-700 hover:text-amber-400 transition-all"
              style={{ border: "1px solid rgba(101,67,20,0.3)" }}>
              Create another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
