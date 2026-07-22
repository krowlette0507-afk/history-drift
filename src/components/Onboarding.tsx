"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Mic, Sparkles, Heart, ArrowRight } from "lucide-react";

const ONBOARDING_KEY = "ls_onboarded_v1";

const STEPS = [
  {
    icon: "ðŸ“–",
    title: "Welcome to History Drift",
    body: "This is your personal space to capture your life story â€” told in your own words, preserved for your family forever.",
    cta: null,
  },
  {
    icon: null,
    lucide: Mic,
    color: "#c8843a",
    title: "Start with an interview",
    body: "An AI interviewer will guide you with thoughtful questions about your life â€” childhood, family, work, and the moments that shaped you. Just talk.",
    cta: null,
  },
  {
    icon: null,
    lucide: Sparkles,
    color: "#c84a9a",
    title: "Turn your story into art",
    body: "Once you've shared your story, Re-Live transforms it into a beautiful illustrated storyboard â€” like a movie of your life.",
    cta: null,
  },
  {
    icon: null,
    lucide: Heart,
    color: "#c84a4a",
    title: "Invite your family",
    body: "Family members can contribute their own memories to your story â€” no account needed. Every voice makes the story richer.",
    cta: null,
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShow(true);
  }, []);

  function dismiss() {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(ONBOARDING_KEY, "1");
      setShow(false);
    }, 300);
  }

  function finish() {
    dismiss();
    router.push("/interview");
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  }

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const LucideIcon = current.lucide ?? null;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-end md:justify-center px-0 md:px-4"
      style={{
        background: "rgba(4,2,0,0.85)",
        backdropFilter: "blur(6px)",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      {/* Card */}
      <div
        className="w-full md:max-w-sm rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #130c04 0%, #1e1208 100%)",
          border: "1px solid rgba(120,70,20,0.3)",
          maxHeight: "85vh",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? "#c84a9a" : i < step ? "rgba(200,74,154,0.4)" : "rgba(100,60,20,0.4)",
                }} />
            ))}
          </div>
          <button onClick={dismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(40,24,8,0.8)", color: "rgba(220,175,80,0.95)" }}>
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-7 py-6 text-center">
          {/* Icon */}
          <div className="mb-6">
            {current.icon ? (
              <div className="text-6xl leading-none">{current.icon}</div>
            ) : LucideIcon ? (
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
                style={{ background: `${current.color}18`, border: `1.5px solid ${current.color}35` }}>
                <LucideIcon size={36} style={{ color: current.color }} />
              </div>
            ) : null}
          </div>

          <h2 className="font-serif font-bold text-2xl leading-tight mb-4"
            style={{ color: "#f0d060" }}>
            {current.title}
          </h2>

          <p className="font-serif text-base leading-relaxed"
            style={{ color: "rgba(220,180,100,0.8)" }}>
            {current.body}
          </p>
        </div>

        {/* Bottom actions */}
        <div className="px-5 pb-8 pt-2 flex-shrink-0 space-y-3">
          {isLast ? (
            <>
              <button onClick={finish}
                className="w-full py-4 rounded-2xl font-serif font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)", color: "white" }}>
                <Mic size={20} /> Start my first interview
              </button>
              <button onClick={dismiss}
                className="w-full py-3 rounded-2xl font-serif text-sm transition-all"
                style={{ color: "rgba(220,175,80,0.92)" }}>
                I'll explore on my own
              </button>
            </>
          ) : (
            <>
              <button onClick={next}
                className="w-full py-4 rounded-2xl font-serif font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#5a3018,#c8843a)", color: "white" }}>
                Next <ChevronRight size={18} />
              </button>
              <button onClick={dismiss}
                className="w-full py-3 rounded-2xl font-serif text-sm transition-all"
                style={{ color: "rgba(220,175,80,0.88)" }}>
                Skip intro
              </button>
            </>
          )}
        </div>

        {/* Home indicator space on mobile */}
        <div className="h-2 flex-shrink-0" />
      </div>

      {/* Desktop: also show a quick-start tip */}
      <div className="hidden md:flex items-center gap-2 mt-4 text-xs font-sans"
        style={{ color: "rgba(200,160,70,0.88)" }}>
        <ArrowRight size={12} /> Press Esc or click outside to skip
      </div>
    </div>
  );
}
