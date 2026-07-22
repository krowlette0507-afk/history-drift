"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProfileTranscripts, getStats } from "@/lib/storage";
import { Scroll, Mic, Loader2, Copy, Check, Plus, Trash2 } from "lucide-react";

interface LegacyDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

const DOCUMENT_TEMPLATES = [
  {
    id: "letter-children",
    title: "Letter to My Children",
    type: "Legacy Letter",
    prompt: "Write a heartfelt letter to my children sharing my most important values, life lessons, and wishes for their future. Include specific advice, memories we shared, and what I hope they carry forward.",
  },
  {
    id: "letter-grandchildren",
    title: "Letter to Future Grandchildren",
    type: "Legacy Letter",
    prompt: "Write a letter to grandchildren who may not have known me well, introducing who I was, what I believed in, and what I hope they understand about our family's story.",
  },
  {
    id: "values-statement",
    title: "My Core Values",
    type: "Values Document",
    prompt: "Write a personal values statement based on my life experiences â€” the principles I lived by, the things that mattered most, and the beliefs that guided my decisions.",
  },
  {
    id: "family-wishes",
    title: "Wishes for My Family",
    type: "Legacy Wishes",
    prompt: "Write a loving statement of my wishes for my family â€” not material wishes, but hopes, dreams, and guidance for how I'd like them to treat each other, face challenges, and find joy.",
  },
];

function getStoredDocuments(): LegacyDocument[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("ls_legacy_docs") || "[]");
  } catch { return []; }
}

function saveDocuments(docs: LegacyDocument[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("ls_legacy_docs", JSON.stringify(docs));
}

export default function LegacyPage() {
  const [documents, setDocuments] = useState<LegacyDocument[]>([]);
  const [selected, setSelected] = useState<LegacyDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [stats, setStats] = useState({ exchangeCount: 0 });
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    setDocuments(getStoredDocuments());
    setTranscripts(getProfileTranscripts());
    setStats(getStats());
  }, []);

  const hasContent = stats.exchangeCount > 0;

  async function generateDocument(title: string, type: string, prompt: string) {
    if (!hasContent) return;
    setLoading(true);
    try {
      const context = transcripts.join("\n\n---\n\n");
      const res = await fetch("/api/biography/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: "local",
          profileName: "the author",
          style: "legacy-letter",
          transcripts: [
            `Special instruction for this document: ${prompt}`,
            ...transcripts,
          ],
        }),
      });
      const data = await res.json();
      if (data.biography) {
        const doc: LegacyDocument = {
          id: `${Date.now()}`,
          title,
          content: data.biography,
          type,
          createdAt: new Date().toISOString(),
        };
        const updated = [doc, ...documents];
        setDocuments(updated);
        saveDocuments(updated);
        setSelected(doc);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setShowCustom(false);
      setCustomTitle("");
      setCustomPrompt("");
    }
  }

  function deleteDocument(id: string) {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    saveDocuments(updated);
    if (selected?.id === id) setSelected(null);
  }

  async function copy() {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hasContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <Scroll size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Legacy Documents</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-sm mb-6">
          Complete at least one interview to generate legacy letters, values statements, and personal wishes for your family.
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
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-amber-900/20 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-900/20">
          <h1 className="text-amber-200 font-serif font-semibold text-lg">Legacy Documents</h1>
          <p className="text-amber-800/50 text-xs font-sans mt-0.5">{documents.length} document{documents.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
          {/* Templates */}
          <div className="text-[9px] font-sans uppercase tracking-widest text-amber-800/40 px-2 mb-1">Create from template</div>
          {DOCUMENT_TEMPLATES.map((tmpl) => (
            <button key={tmpl.id}
              onClick={() => generateDocument(tmpl.title, tmpl.type, tmpl.prompt)}
              disabled={loading}
              className="w-full text-left p-3 rounded-xl border border-amber-900/20 hover:border-amber-800/30 transition-all disabled:opacity-50"
              style={{ background: "rgba(15,10,4,0.5)" }}>
              <div className="text-xs font-serif text-amber-300/80 font-semibold">{tmpl.title}</div>
              <div className="text-[9px] font-sans text-amber-800/40 mt-0.5">{tmpl.type}</div>
            </button>
          ))}

          {/* Custom */}
          <button onClick={() => setShowCustom(!showCustom)}
            className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-amber-900/25 text-amber-700/50 hover:text-amber-500 hover:border-amber-800/35 transition-all text-xs font-sans">
            <Plus size={12} />
            Custom document
          </button>

          {showCustom && (
            <div className="space-y-2 px-1">
              <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Document title"
                className="w-full rounded-lg px-3 py-2 text-xs font-sans text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-700/40"
                style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.3)" }} />
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="What should this document say or cover?"
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-xs font-sans text-amber-200 resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/40"
                style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.3)" }} />
              <button onClick={() => generateDocument(customTitle || "Custom Document", "Custom", customPrompt)}
                disabled={!customTitle || !customPrompt || loading}
                className="w-full py-2 rounded-lg text-xs font-serif font-semibold text-amber-100 transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
                Generate
              </button>
            </div>
          )}

          {/* Saved documents */}
          {documents.length > 0 && (
            <>
              <div className="text-[9px] font-sans uppercase tracking-widest text-amber-800/40 px-2 mt-3 mb-1">Saved documents</div>
              {documents.map((doc) => (
                <div key={doc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(doc)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(doc)}
                  className="w-full text-left p-3 rounded-xl border transition-all group cursor-pointer"
                  style={{
                    borderColor: selected?.id === doc.id ? "rgba(200,160,70,0.88)" : "rgba(90,52,20,0.2)",
                    background: selected?.id === doc.id ? "rgba(40,24,8,0.6)" : "rgba(15,10,4,0.4)",
                  }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-serif text-amber-300/80 font-semibold truncate">{doc.title}</div>
                      <div className="text-[9px] font-sans text-amber-800/40 mt-0.5">
                        {new Date(doc.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 text-amber-800/40 hover:text-red-500/60 transition-all flex-shrink-0 p-0.5">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 size={28} className="animate-spin text-amber-600/60" />
            <p className="text-amber-700/50 font-serif italic text-sm">Writing your legacy documentâ€¦</p>
          </div>
        ) : selected ? (
          <>
            <div className="px-6 py-4 border-b border-amber-900/20 flex items-center justify-between flex-shrink-0"
              style={{ background: "rgba(10,6,2,0.5)" }}>
              <div>
                <h2 className="text-amber-200 font-serif font-semibold">{selected.title}</h2>
                <div className="text-[9px] font-sans text-amber-800/40 mt-0.5">
                  {selected.type} Â· {new Date(selected.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button onClick={copy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans border border-amber-900/25 text-amber-700/60 hover:text-amber-400 transition-all">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {selected.content.split("\n\n").map((para, i) =>
                  para.trim() && (
                    <p key={i} className="text-amber-300/85 font-serif text-sm leading-relaxed">{para.trim()}</p>
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <Scroll size={32} className="text-amber-800/25" />
            <p className="text-amber-700/50 font-serif italic text-sm max-w-xs">
              Select a template to generate a legacy document, or choose a saved one to read.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
