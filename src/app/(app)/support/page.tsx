"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Send, Loader2, Sparkles, BookOpen, Mic, Clock, Users, MapPin, Lightbulb, Scroll, Lock, Heart, Star } from "lucide-react";

// ── FAQ / User Guide data ────────────────────────────────────────────

const GUIDE_SECTIONS = [
  {
    icon: Mic,
    color: "#c8843a",
    title: "Interview",
    summary: "The heart of History Drift. An AI interviewer guides you through your life story with thoughtful questions.",
    details: `The Interview is where your story begins. Choose one of our AI interviewers — each has a different style, from warm and personal to journalistic and structured.

How it works:
• Tap the microphone and speak your answer naturally — the AI listens and transcribes in real time
• After each answer, the interviewer asks a follow-up question tailored to what you shared
• Interviews are organised into phases: Early Life, Family, Career, Challenges, Legacy
• You can pause and resume any time — your progress is saved automatically

Tips:
• Speak in full sentences and take your time — there's no rush
• Mention names of people and places — the app captures them automatically
• If the AI mishears a word, tap the text area to correct it before submitting

To edit or delete: Go to the interview session, tap the answer you want to change, and edit the text directly. To delete an entire session, use the session menu (⋯).`,
  },
  {
    icon: Star,
    color: "#c84a9a",
    title: "Re-Live",
    summary: "Transforms your story into a beautiful illustrated storyboard — like a movie of your life.",
    details: `Re-Live takes the story you've shared and turns it into a series of illustrated panels, each with an image, title, and caption — like a graphic novel or movie storyboard.

How it works:
• Step 1: Choose a story — either from an interview session or type/speak your own
• Step 2: Optionally upload a reference photo so the AI can match the appearance of your subject
• Step 3: Choose your art style (Cinematic, Illustrated, or Graphic Novel) and panel count (12 or 16)
• The AI plans the key visual moments, generates each panel image, and composes the final storyboard
• Download the finished storyboard as a high-quality image

Art styles:
• Cinematic Concept Art — photorealistic, dramatic lighting, film-quality
• Illustrated Story — warm, painted, storybook feel
• Graphic Novel — bold lines, high contrast, comic-book style

Tips:
• More detail in your story = better panels — use the AI Refine button on Step 1 to improve your input
• The age selector helps the AI render characters at the right life stage
• Previously generated storyboards appear at the top of Step 1 — tap to view or download`,
  },
  {
    icon: Clock,
    color: "#6a8a4a",
    title: "Timeline",
    summary: "A visual chronology of the key events, dates, and milestones extracted from your interviews.",
    details: `The Timeline automatically extracts dates, years, and events from everything you've shared in interviews and organises them in chronological order.

What appears here:
• Life milestones (births, marriages, moves, career changes)
• Specific dates and years you mentioned
• Key events described in your answers

How to edit:
• Timeline entries are derived from your interview answers — to correct a date or event, go back to the interview exchange that mentioned it and edit the answer
• The timeline refreshes automatically when you update an interview

Note: If a date is approximate (e.g. "in my thirties"), it will appear as an estimated period rather than a specific year.`,
  },
  {
    icon: Users,
    color: "#4a7a8a",
    title: "People",
    summary: "Everyone you mention in your interviews — family, friends, mentors — collected in one place.",
    details: `The People section automatically identifies and lists every person you mention across all your interviews — their name, relationship to you, and how many times they appear.

How it works:
• The AI extracts names and relationships from each answer as you go
• Each person card shows their name, relationship, and memorable quotes about them
• Tap a card to expand it and see what you said

Correcting a name:
• If the AI got a name wrong (e.g. "DB" instead of "Bebe"), tap the pencil ✏ icon on the person's card
• Enter the correct name and relationship, then tap Save correction
• This automatically updates every interview exchange that mentions that person — in your device and in the cloud`,
  },
  {
    icon: MapPin,
    color: "#8a4a8a",
    title: "Places",
    summary: "Every location mentioned in your story — cities, homes, schools, places of work.",
    details: `Places captures every location you mention across your interviews — from the town you grew up in to the school you attended and the cities you've lived in.

Each place card shows:
• The place name and type (city, home, school, workplace, etc.)
• How many times it appears in your story
• Context quotes from your interviews

To edit: Like People, places are derived from your interview answers. To correct a place name or type, find the interview exchange where you mentioned it and update the answer.`,
  },
  {
    icon: Lightbulb,
    color: "#8a8a2a",
    title: "Life Lessons",
    summary: "The wisdom and insights the AI extracts from your story — the things you've learned.",
    details: `Life Lessons captures the wisdom, advice, and insights woven through your story — the things you've learned from hard times, good times, and everything in between.

These are automatically extracted from your interview answers and grouped by theme. They make powerful material for legacy letters and biography chapters.

To add more: The best way to enrich this section is to complete more interviews — especially when answering questions about challenges, regrets, and advice you'd give to younger generations.`,
  },
  {
    icon: BookOpen,
    color: "#3a6a8a",
    title: "Biography",
    summary: "An AI-written narrative biography drawn entirely from your interviews.",
    details: `The Biography section uses everything you've shared in interviews to write a flowing, narrative life story in your voice.

How it works:
• Tap Generate Biography and choose a writing style
• The AI reads all your interview answers and composes a multi-chapter narrative
• Chapters are organised by life phase: Early Life, Family & Relationships, Career, Challenges & Growth, Legacy

Tips:
• The more interviews you complete, the richer the biography
• You can regenerate at any time to incorporate new interview sessions
• Copy the text to paste into a Word document, email, or print

To edit: The biography is AI-generated text — copy it and edit in any word processor. We plan to add direct in-app editing soon.`,
  },
  {
    icon: Scroll,
    color: "#8a5a2a",
    title: "Legacy",
    summary: "AI-generated letters and documents — for your children, grandchildren, or anyone who comes after.",
    details: `Legacy lets you generate heartfelt personal documents drawn from your story — letters to your children, values statements, wishes for your family.

Available templates:
• Letter to My Children — values, lessons, and wishes
• Letter to Future Grandchildren — introducing who you were
• My Core Values — the principles you lived by
• Wishes for My Family — hopes, not material wishes

How it works:
• Choose a template (or write a custom prompt)
• The AI reads your interviews and writes the document in your voice
• Copy to share, print, or save

To delete a saved document: Tap the trash icon that appears when you hover over a document in the sidebar.`,
  },
  {
    icon: Heart,
    color: "#c84a4a",
    title: "Family Memories",
    summary: "Invite family and friends to contribute their own memories to your story.",
    details: `Family Memories lets you invite people who know you — children, siblings, old friends — to add their own memories alongside yours.

How to invite:
• Go to Family Memories and tap Invite
• Enter their email address, their name, and an optional personal message
• They receive an email with a personal link — no account needed
• They fill in their name, relationship, story, and can attach photos (up to 3 photos, 40MB each)

Viewing contributions:
• Each invite card shows a green "contributed" badge when someone responds
• Tap the card to expand and read their full memory and see any photos they shared
• The bell icon in the top bar shows a badge when new contributions arrive

Note: Each invite link is single-use — once someone submits, the link is marked as contributed.`,
  },
  {
    icon: Lock,
    color: "#5a5a8a",
    title: "Family Vault",
    summary: "A secure space to store important documents and media for your family.",
    details: `The Family Vault is a secure private storage area for documents, photos, and media you want to preserve for your family.

Coming soon — full upload, tagging, and sharing features are planned for a future update.`,
  },
];

const FAQS = [
  { q: "Is my story private?", a: "Yes. Your interviews and story are private to your account by default. Only you can see them. Family members you invite via the Family Memories feature can submit a memory, but they cannot read your interviews or other content." },
  { q: "Can I delete an interview or answer?", a: "Yes. To delete a full interview session, use the session menu (⋯) on the interview screen. To edit a specific answer, find the exchange in your session and tap to edit the text. Edited answers automatically update your People, Places, Timeline, and other sections." },
  { q: "What happens if the AI gets a name wrong?", a: "Go to the People section and tap the pencil ✏ icon on the incorrectly named person. Enter the correct name and relationship and tap Save — this updates every interview that mentioned that name." },
  { q: "How do I activate my account after signing up?", a: "After you sign up, History Drift sends a confirmation email to the address you registered with. Open the email and tap the 'Confirm your email' button or link. You'll be taken straight into the app. If you don't see the email within a few minutes, check your spam or junk folder. If it's still not there, go back to the sign-in screen and tap 'Resend confirmation email'." },
  { q: "How do I reset my password?", a: "On the sign-in screen, tap 'Forgot password?' below the password field and enter your email address. You'll receive a password reset email within a few minutes — check your spam folder if it doesn't arrive. Tap the link in the email (it expires after 1 hour), enter your new password twice, and you'll be signed in automatically. You can also change your password at any time when signed in via Settings → Password tab." },
  { q: "Can family members use the app without an account?", a: "Yes — for contributing memories only. When you send a Family Memories invite, the recipient receives a personal link. They can submit a memory and photos without creating an account. To use the full app (interviews, Re-Live, etc.) an account is required." },
  { q: "How long does Re-Live take to generate?", a: "A 12-panel Premium storyboard typically takes 3–5 minutes as each panel image is generated individually at high quality. You'll see a live progress bar. Don't close the page while it's generating." },
  { q: "Can I change the art style after generating a storyboard?", a: "Yes — go back to Re-Live, select the same story, choose a different art style, and generate again. Previous storyboards are saved and accessible from the gallery at the top of Step 1." },
  { q: "Will my data be lost if I clear my browser?", a: "Your interview data is stored both on your device (localStorage) and in the cloud (Supabase) when you're signed in. Signing in on a new device will restore your data automatically." },
  { q: "How do I invite family members?", a: "Go to Family Memories in the navigation menu, tap Invite, enter their email and an optional personal message, and tap Send invite. They'll receive an email with a private link to contribute." },
  { q: "Can I export my biography or storyboard?", a: "Yes. The Biography section has a Copy button to copy text to your clipboard. Storyboards have a Download button that saves the full high-resolution image to your device." },
];

// ── Support chat ─────────────────────────────────────────────────────

const SUPPORT_CONTEXT = `You are a friendly and helpful support assistant for History Drift, a life story app. Answer questions about how the app works based on this user guide and FAQ. Be concise, warm, and specific. If something isn't covered, say so honestly and suggest they contact support at support@historydrift.com.

USER GUIDE SECTIONS:
${GUIDE_SECTIONS.map(s => `${s.title}: ${s.details}`).join("\n\n")}

FAQs:
${FAQS.map(f => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}`;

interface ChatMsg { role: "user" | "assistant"; content: string; }

const SUGGESTED = [
  "How do I start my first interview?",
  "Why did the AI get a name wrong?",
  "How long does Re-Live take?",
  "Can family contribute without an account?",
];

// ── Components ───────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.22)" }}>
      <button className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3"
        onClick={() => setOpen(!open)}>
        <span className="font-serif text-sm font-semibold" style={{ color: "#e8d080" }}>{q}</span>
        {open ? <ChevronUp size={14} style={{ color: "rgba(160,110,50,0.6)", flexShrink: 0 }} />
               : <ChevronDown size={14} style={{ color: "rgba(160,110,50,0.6)", flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(80,50,15,0.2)" }}>
          <p className="font-serif text-sm leading-relaxed pt-3" style={{ color: "rgba(210,175,100,0.8)" }}>{a}</p>
        </div>
      )}
    </div>
  );
}

function GuideItem({ section }: { section: typeof GUIDE_SECTIONS[0] }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: "rgba(18,11,4,0.7)", border: `1px solid ${open ? section.color + "35" : "rgba(90,52,20,0.22)"}` }}>
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen(!open)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${section.color}18`, border: `1px solid ${section.color}30` }}>
          <Icon size={16} style={{ color: section.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-serif text-sm font-semibold" style={{ color: "#e8d080" }}>{section.title}</div>
          <div className="text-[11px] font-sans mt-0.5 truncate" style={{ color: "rgba(160,110,50,0.6)" }}>{section.summary}</div>
        </div>
        {open ? <ChevronUp size={14} style={{ color: "rgba(160,110,50,0.5)", flexShrink: 0 }} />
               : <ChevronDown size={14} style={{ color: "rgba(160,110,50,0.5)", flexShrink: 0 }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: `${section.color}20` }}>
          <div className="pt-3 space-y-2">
            {section.details.split("\n").map((line, i) => (
              line.trim() ? (
                <p key={i} className={`font-serif text-sm leading-relaxed ${line.startsWith("•") ? "pl-3" : ""}`}
                  style={{ color: line.startsWith("•") ? "rgba(210,175,100,0.75)" : line.endsWith(":") ? "#c8a050" : "rgba(210,175,100,0.85)", fontWeight: line.endsWith(":") ? "600" : "400" }}>
                  {line}
                </p>
              ) : <div key={i} className="h-1" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tab, setTab] = useState<"guide" | "faq" | "chat">("guide");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], context: SUPPORT_CONTEXT }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.answer ?? "I'm not sure about that — please email support@historydrift.com." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex-shrink-0 border-b" style={{ borderColor: "rgba(80,50,15,0.2)", background: "rgba(10,6,2,0.5)" }}>
        <div className="text-[11px] font-sans uppercase tracking-widest mb-0.5" style={{ color: "rgba(150,100,40,0.6)" }}>History Drift</div>
        <h1 className="font-serif font-bold text-xl" style={{ color: "#f0d060" }}>Support & FAQs</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-3 mb-3 p-1 rounded-xl flex-shrink-0"
        style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,55,15,0.3)" }}>
        {([["guide", BookOpen, "User Guide"], ["faq", ChevronDown, "FAQs"], ["chat", Sparkles, "Ask AI"]] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-serif transition-all"
            style={{
              background: tab === key ? "rgba(122,45,138,0.35)" : "transparent",
              color: tab === key ? "#e0a0f0" : "rgba(180,130,60,0.6)",
              border: tab === key ? "1px solid rgba(200,74,154,0.3)" : "1px solid transparent",
            }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">

        {/* User Guide */}
        {tab === "guide" && (
          <div className="space-y-2">
            <p className="text-xs font-serif italic mb-4" style={{ color: "rgba(160,110,50,0.6)" }}>
              Tap any section to expand the full guide for that feature.
            </p>
            {GUIDE_SECTIONS.map(s => <GuideItem key={s.title} section={s} />)}
            <div className="mt-6 px-4 py-4 rounded-xl text-center"
              style={{ background: "rgba(18,11,4,0.5)", border: "1px solid rgba(80,50,15,0.2)" }}>
              <p className="text-xs font-serif" style={{ color: "rgba(160,110,50,0.6)" }}>
                Still need help? Email us at{" "}
                <a href="mailto:support@historydrift.com" className="underline" style={{ color: "#c8843a" }}>
                  support@historydrift.com
                </a>
              </p>
            </div>
          </div>
        )}

        {/* FAQs */}
        {tab === "faq" && (
          <div className="space-y-2">
            {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
            <div className="mt-6 px-4 py-4 rounded-xl text-center"
              style={{ background: "rgba(18,11,4,0.5)", border: "1px solid rgba(80,50,15,0.2)" }}>
              <p className="text-xs font-serif" style={{ color: "rgba(160,110,50,0.6)" }}>
                Don't see your question?{" "}
                <button onClick={() => setTab("chat")} className="underline" style={{ color: "#c8843a" }}>
                  Ask our AI assistant
                </button>
              </p>
            </div>
          </div>
        )}

        {/* AI Chat */}
        {tab === "chat" && (
          <div className="flex flex-col h-full">
            {messages.length === 0 && (
              <div>
                <p className="text-xs font-serif italic mb-4" style={{ color: "rgba(160,110,50,0.6)" }}>
                  Ask anything about how History Drift works.
                </p>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {SUGGESTED.map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="text-left px-4 py-3 rounded-xl text-sm font-serif transition-all"
                      style={{ background: "rgba(18,11,4,0.7)", border: "1px solid rgba(90,52,20,0.25)", color: "rgba(200,160,80,0.85)" }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1"
                      style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)" }}>
                      <Sparkles size={11} className="text-white" />
                    </div>
                  )}
                  <div className="max-w-xs rounded-2xl px-4 py-3 text-sm font-serif leading-relaxed"
                    style={msg.role === "user"
                      ? { background: "rgba(45,28,10,0.7)", border: "1px solid rgba(120,80,30,0.3)", color: "rgba(210,175,100,0.9)" }
                      : { background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.25)", color: "rgba(230,200,140,0.9)" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)" }}>
                    <Sparkles size={11} className="text-white" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 border"
                    style={{ background: "rgba(20,12,4,0.8)", borderColor: "rgba(90,52,20,0.25)" }}>
                    <div className="flex gap-1.5">
                      {[0,150,300].map(d => (
                        <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce bg-amber-600/60"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
        )}
      </div>

      {/* Chat input — only on chat tab */}
      {tab === "chat" && (
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t" style={{ borderColor: "rgba(80,50,15,0.2)", background: "rgba(10,6,2,0.6)" }}>
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask a support question…" disabled={loading}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none"
              style={{ background: "rgba(20,12,4,0.8)", border: "1px solid rgba(90,52,20,0.35)", color: "#e8d4a0" }} />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg,#7a2d8a,#c84a9a)" }}>
              {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
