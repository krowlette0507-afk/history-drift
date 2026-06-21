"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProfileTranscripts, getStats } from "@/lib/storage";
import { BookOpen, Mic, Loader2, Copy, Check, Download, ChevronRight } from "lucide-react";

type BiographyStyle = "short" | "full" | "memoir" | "family-history" | "legacy-letter" | "celebration" | "obituary";

const BIOGRAPHY_FORMATS: {
  id: BiographyStyle;
  label: string;
  description: string;
  icon: string;
  length: string;
  color: string;
}[] = [
  { id: "short", label: "Short Biography", description: "2–3 paragraphs capturing the essence of a life", icon: "📄", length: "~250 words", color: "#c8843a" },
  { id: "full", label: "Full Biography", description: "Comprehensive narrative covering the complete life arc", icon: "📖", length: "~1,000 words", color: "#7a4a20" },
  { id: "memoir", label: "Memoir Chapter", description: "First-person narrative in their own voice", icon: "✍️", length: "~750 words", color: "#8a5c8a" },
  { id: "family-history", label: "Family History", description: "Their role in the family tree and legacy", icon: "🌳", length: "~600 words", color: "#3a8a4a" },
  { id: "legacy-letter", label: "Legacy Letter", description: "A letter to loved ones and future generations", icon: "💌", length: "~500 words", color: "#2a7a8a" },
  { id: "celebration", label: "Celebration of Life", description: "Uplifting tribute for a memorial service", icon: "🕊️", length: "~500 words", color: "#2a6a5a" },
  { id: "obituary", label: "Obituary Draft", description: "Dignified obituary for publication", icon: "📜", length: "~350 words", color: "#5a5a8a" },
];

export default function BiographyPage() {
  const [profileName, setProfileName] = useState("Your Story");
  const [selectedStyle, setSelectedStyle] = useState<BiographyStyle>("full");
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [stats, setStats] = useState({ exchangeCount: 0, wordCount: 0 });

  useEffect(() => {
    setTranscripts(getProfileTranscripts());
    setStats(getStats());
  }, []);

  const hasContent = transcripts.length > 0 && stats.exchangeCount > 0;
  const currentGenerated = generated[selectedStyle];

  async function generate() {
    if (!hasContent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/biography/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: "local",
          profileName,
          style: selectedStyle,
          transcripts,
        }),
      });
      const data = await res.json();
      if (data.biography) {
        setGenerated((prev) => ({ ...prev, [selectedStyle]: data.biography }));
      }
    } catch {
      setGenerated((prev) => ({ ...prev, [selectedStyle]: "Failed to generate biography. Please try again." }));
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!currentGenerated) return;
    await navigator.clipboard.writeText(currentGenerated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadText() {
    if (!currentGenerated) return;
    const fmt = BIOGRAPHY_FORMATS.find((f) => f.id === selectedStyle);
    const blob = new Blob([currentGenerated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profileName.replace(/\s+/g, "_")}_${fmt?.label.replace(/\s+/g, "_") || selectedStyle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hasContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <BookOpen size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Biography Generator</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-md mb-3">
          Complete at least one interview session to generate your biography. The more you share, the richer the story.
        </p>
        <Link href="/interview"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif text-amber-100 transition-all hover:scale-105 mt-3"
          style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
          <Mic size={15} />
          Start Interview
        </Link>
      </div>
    );
  }

  const selectedFmt = BIOGRAPHY_FORMATS.find((f) => f.id === selectedStyle)!;

  return (
    <div className="min-h-screen overflow-y-auto px-8 py-8">
      <div className="mb-8">
        <div className="text-amber-600/50 text-xs font-sans uppercase tracking-[0.3em] mb-1">Your Legacy</div>
        <h1 className="text-amber-200 font-serif font-bold text-3xl">Biography Generator</h1>
        <p className="text-amber-700/50 font-sans text-sm mt-1">
          {stats.exchangeCount} exchanges · {stats.wordCount.toLocaleString()} words of story captured
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Format selector */}
        <div className="col-span-1 space-y-4">
          <div className="mb-4">
            <label className="text-[10px] font-sans text-amber-700/50 uppercase tracking-widest mb-2 block">
              Your Name
            </label>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-sans text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-700/50"
              style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.35)" }}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <div className="text-[10px] font-sans text-amber-700/50 uppercase tracking-widest mb-3">Format</div>
            <div className="space-y-2">
              {BIOGRAPHY_FORMATS.map((fmt) => {
                const isSelected = selectedStyle === fmt.id;
                const isGenerated = !!generated[fmt.id];
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedStyle(fmt.id)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      borderColor: isSelected ? `${fmt.color}50` : "rgba(90,52,20,0.2)",
                      background: isSelected ? `${fmt.color}10` : "rgba(15,10,4,0.5)",
                    }}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">{fmt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-serif font-semibold"
                          style={{ color: isSelected ? fmt.color : "rgba(200,160,90,0.7)" }}>
                          {fmt.label}
                        </span>
                        {isGenerated && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: fmt.color }} />
                        )}
                      </div>
                      <div className="text-[9px] font-sans text-amber-800/50 mt-0.5 leading-tight">{fmt.length}</div>
                    </div>
                    {isSelected && <ChevronRight size={12} style={{ color: fmt.color, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Generated content */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{selectedFmt.icon}</span>
                <h2 className="text-amber-200 font-serif font-semibold text-lg">{selectedFmt.label}</h2>
              </div>
              <p className="text-amber-800/50 text-xs font-sans mt-0.5">{selectedFmt.description} · {selectedFmt.length}</p>
            </div>
            <div className="flex items-center gap-2">
              {currentGenerated && (
                <>
                  <button onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border border-amber-900/25 text-amber-700/60 hover:text-amber-400 hover:border-amber-700/40 transition-all">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={downloadText}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border border-amber-900/25 text-amber-700/60 hover:text-amber-400 hover:border-amber-700/40 transition-all">
                    <Download size={12} />
                    Save .txt
                  </button>
                </>
              )}
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-serif font-semibold transition-all disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${selectedFmt.color}, #c8843a)`,
                  color: "rgba(255,240,210,0.95)",
                  boxShadow: `0 2px 12px ${selectedFmt.color}30`,
                }}
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                {loading ? "Generating…" : currentGenerated ? "Regenerate" : "Generate"}
              </button>
            </div>
          </div>

          <div
            className="rounded-2xl min-h-[500px] p-6"
            style={{ background: "rgba(18,11,4,0.7)", border: `1px solid ${selectedFmt.color}20` }}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 size={28} className="animate-spin" style={{ color: selectedFmt.color }} />
                <div className="text-center">
                  <p className="text-amber-400/70 font-serif italic text-sm">Crafting your {selectedFmt.label.toLowerCase()}…</p>
                  <p className="text-amber-800/40 text-xs font-sans mt-1">This takes 20–40 seconds</p>
                </div>
              </div>
            ) : currentGenerated ? (
              <div className="prose prose-sm max-w-none">
                {currentGenerated.split("\n\n").map((para, i) => (
                  para.trim() && (
                    <p key={i} className="text-amber-300/85 font-serif text-sm leading-relaxed mb-4 last:mb-0">
                      {para.trim()}
                    </p>
                  )
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
                <span className="text-4xl opacity-30">{selectedFmt.icon}</span>
                <div>
                  <p className="text-amber-700/50 font-serif italic text-sm">
                    Click &ldquo;Generate&rdquo; to create your {selectedFmt.label.toLowerCase()}.
                  </p>
                  <p className="text-amber-800/35 text-xs font-sans mt-1">
                    Based on {stats.exchangeCount} interview exchange{stats.exchangeCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
