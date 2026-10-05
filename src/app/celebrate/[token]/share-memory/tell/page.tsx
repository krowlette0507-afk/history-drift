"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Mode = "write" | "record";

export default function TellStoryPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("write");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [approxYear, setApproxYear] = useState("");
  const [location, setLocation] = useState("");
  const [permFamily, setPermFamily] = useState(true);
  const [permHd, setPermHd] = useState(false);

  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch {
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const uploadAudio = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, "memory.webm");
    const res = await fetch("/api/celebrate/upload-audio", { method: "POST", body: formData });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Upload failed");
    return d.url;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (mode === "write" && !story.trim()) { setError("Please write your story."); return; }

    setSaving(true);
    setError("");
    try {
      let audioFile = "";
      if (audioBlob) audioFile = await uploadAudio(audioBlob);

      const res = await fetch("/api/celebrate/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          storyteller_name: name,
          relationship,
          title: title || `A memory from ${name}`,
          story_text: story,
          audio_file: audioFile,
          approximate_year: approxYear ? parseInt(approxYear) : null,
          location,
          permission_family: permFamily,
          permission_historydrift: permHd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/celebrate/${token}?shared=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(212,160,23,0.2)",
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text mb-1">Tell a Story</h1>
        <p className="font-serif text-[#f5ead8]/50 text-sm">A memory shared, a legacy preserved.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(212,160,23,0.2)" }}>
        {(["write", "record"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 font-serif text-sm capitalize transition-all"
            style={
              mode === m
                ? { background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)", color: "#0f0a04", fontWeight: 600 }
                : { background: "transparent", color: "rgba(245,234,216,0.5)" }
            }
          >
            {m === "write" ? "✍ Write" : "🎙 Record"}
          </button>
        ))}
      </div>

      {/* About you */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">About you</p>
        <input
          type="text"
          placeholder="Your name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Your relationship (e.g. cousin, colleague…)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* The memory */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">The memory</p>
        <input
          type="text"
          placeholder="Give it a title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />

        {mode === "write" ? (
          <textarea
            rows={6}
            placeholder="Tell your story…"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className={inputClass + " resize-none"}
            style={inputStyle}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            {audioUrl ? (
              <>
                <audio src={audioUrl} controls className="w-full" />
                <button
                  type="button"
                  onClick={() => { setAudioBlob(null); setAudioUrl(null); }}
                  className="text-xs font-serif text-gold/40 hover:text-gold/70 transition-colors"
                >
                  Record again
                </button>
              </>
            ) : recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full text-2xl flex items-center justify-center animate-pulse"
                style={{ background: "rgba(200,60,60,0.2)", border: "2px solid rgba(200,60,60,0.5)" }}
              >
                ⏹
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full text-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
              >
                🎙
              </button>
            )}
            <p className="text-xs font-serif text-gold/30">
              {recording ? "Recording — tap to stop" : audioUrl ? "" : "Tap the mic to begin"}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Year (approx)"
            value={approxYear}
            onChange={(e) => setApproxYear(e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, flex: 1 }}
            min={1900}
            max={2030}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, flex: 2 }}
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Permissions</p>
        {[
          { label: "Share with family members", value: permFamily, set: setPermFamily },
          { label: "Allow History Drift to preserve this story", value: permHd, set: setPermHd },
        ].map(({ label, value, set }) => (
          <label key={label} className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set(!value)}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={
                value
                  ? { background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }
                  : { background: "transparent", border: "1px solid rgba(212,160,23,0.3)" }
              }
            >
              {value && <span className="text-[#0f0a04] text-xs font-bold">✓</span>}
            </div>
            <span className="font-serif text-xs text-[#f5ead8]/60">{label}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
      >
        {saving ? "Sharing…" : "Share This Memory →"}
      </button>
    </form>
  );
}
