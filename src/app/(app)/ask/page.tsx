"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getProfileTranscripts, getStats } from "@/lib/storage";
import { Sparkles, Mic, Send, Loader2, HelpCircle } from "lucide-react";

interface QAMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What was the most important lesson of their life?",
  "Who was the most influential person in their story?",
  "What were the biggest challenges they faced?",
  "Where did they grow up, and what was it like?",
  "What did they want to be remembered for?",
  "What was their proudest achievement?",
  "How did they meet their spouse or partner?",
  "What advice would they give to younger generations?",
];

export default function AskPage() {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [stats, setStats] = useState({ exchangeCount: 0 });
  const [profileName, setProfileName] = useState("Your Story");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTranscripts(getProfileTranscripts());
    setStats(getStats());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasContent = stats.exchangeCount > 0;

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: QAMessage = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), transcripts, profileName }),
      });
      const data = await res.json();
      const answer = data.answer || "I couldn't find that information in the interviews.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I had trouble answering that. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!hasContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-16 text-center">
        <Sparkles size={40} className="text-amber-800/30 mb-4" />
        <h1 className="text-amber-200 font-serif font-bold text-2xl mb-2">Ask Me Anything</h1>
        <p className="text-amber-700/50 font-serif italic text-sm max-w-md mb-3">
          Once you&apos;ve completed interviews, family members can ask questions about your life story here. Answers come only from what you&apos;ve shared — never invented.
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-900/20 flex-shrink-0"
        style={{ background: "rgba(10,6,2,0.6)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-600/60" />
              <h1 className="text-amber-200 font-serif font-semibold text-lg">Ask Me Anything</h1>
            </div>
            <p className="text-amber-800/50 text-xs font-sans mt-0.5">
              Answers are drawn only from {stats.exchangeCount} interview exchange{stats.exchangeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-sans text-amber-400/80 focus:outline-none"
              style={{ background: "rgba(20,12,4,0.6)", border: "1px solid rgba(90,52,20,0.3)" }}
              placeholder="Person's name…"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="py-4">
            <div className="text-amber-700/50 text-xs font-sans uppercase tracking-widest mb-3 text-center">
              Suggested questions
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} onClick={() => ask(q)}
                  className="text-left p-3 rounded-xl border border-amber-900/20 hover:border-amber-800/35 text-xs font-serif text-amber-600/70 hover:text-amber-400/80 transition-all leading-relaxed"
                  style={{ background: "rgba(18,11,4,0.5)" }}>
                  <HelpCircle size={10} className="inline mr-1.5 opacity-60" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-3 mt-1"
                style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
                <Sparkles size={11} className="text-amber-100" />
              </div>
            )}
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm font-serif leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm"
                  : "rounded-tl-sm"
              }`}
              style={
                msg.role === "user"
                  ? { background: "rgba(45,28,10,0.7)", border: "1px solid rgba(120,80,30,0.3)", color: "rgba(210,175,100,0.9)" }
                  : { background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.25)", color: "rgba(230,200,140,0.9)" }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-3">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #5a3018, #c8843a)" }}>
              <Sparkles size={11} className="text-amber-100" />
            </div>
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 border"
              style={{ background: "rgba(20,12,4,0.8)", borderColor: "rgba(90,52,20,0.25)" }}>
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce bg-amber-600/60"
                    style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-amber-900/20"
        style={{ background: "rgba(10,6,2,0.7)" }}>
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder={`Ask something about ${profileName}…`}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-sans text-amber-200 placeholder-amber-900/40 focus:outline-none focus:ring-1 focus:ring-amber-700/50 disabled:opacity-60"
            style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.35)" }}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7a4a12, #c8843a)" }}
          >
            {loading ? <Loader2 size={16} className="text-amber-100 animate-spin" /> : <Send size={16} className="text-amber-100" />}
          </button>
        </div>
        <p className="text-[9px] font-sans text-amber-900/35 text-center mt-2">
          Only answers from recorded interviews · Never invents facts
        </p>
      </div>
    </div>
  );
}
