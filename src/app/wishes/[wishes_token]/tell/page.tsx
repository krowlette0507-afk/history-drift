"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Mode = "write" | "record";

export default function WishesTellPage() {
  const { wishes_token } = useParams<{ wishes_token: string }>();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("write");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [message, setMessage] = useState("");

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
        stream.getTracks().forEach((t) => t.stop());
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
    formData.append("file", blob, "wish-voice.webm");
    formData.append("bucket", "celebrate-media");
    const res = await fetch("/api/celebrate/upload-image", { method: "POST", body: formData });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Upload failed");
    return d.url;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (mode === "write" && !message.trim()) { setError("Please write your message."); return; }
    if (mode === "record" && !audioBlob) { setError("Please record your message first."); return; }

    setSaving(true);
    setError("");
    try {
      const media = [];
      if (audioBlob) {
        const url = await uploadAudio(audioBlob);
        media.push({ media_type: "audio", file_url: url, caption: "Voice message" });
      }

      const res = await fetch("/api/wishes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishes_token,
          name,
          relationship,
          message,
          media: media.length ? media : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/wishes/${wishes_token}?wished=1`);
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(212,160,23,0.08)", color: "rgba(212,160,23,0.5)" }}
        >
          ←
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text">Write a Message</h1>
          <p className="font-serif text-[#f5ead8]/50 text-sm">Say happy birthday in your own words.</p>
        </div>
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
            {m === "write" ? "✍ Write" : "🎙 Voice"}
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
          placeholder="Your relationship (e.g. cousin, old friend…)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Message */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">Your wish</p>

        {mode === "write" ? (
          <textarea
            rows={6}
            placeholder="Write your birthday message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
      </div>

      {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
      >
        {saving ? "Sending…" : "Send Birthday Wish →"}
      </button>
    </form>
  );
}
