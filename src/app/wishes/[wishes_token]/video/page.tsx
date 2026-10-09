"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Stage = "idle" | "previewing" | "recording" | "recorded" | "uploading";

const MAX_SECONDS = 30;

function getBestMimeType(): string {
  const types = [
    "video/mp4;codecs=h264,aac",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export default function WishesVideoPage() {
  const { wishes_token } = useParams<{ wishes_token: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => { stopStream(); if (timerRef.current) clearInterval(timerRef.current); }, [stopStream]);

  const startPreview = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setStage("previewing");
    } catch {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = getBestMimeType();
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType, videoBitsPerSecond: 800_000 } : {});
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      stopStream();
      setStage("recorded");
    };
    mr.start(250);
    recorderRef.current = mr;
    setSecondsLeft(MAX_SECONDS);
    setStage("recording");

    let remaining = MAX_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        recorderRef.current?.stop();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  };

  const reRecord = async () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setSecondsLeft(MAX_SECONDS);
    await startPreview();
  };

  const share = async () => {
    if (!videoBlob) return;
    if (!name.trim()) { setError("Please enter your name before sharing."); return; }
    setStage("uploading");
    setError("");
    try {
      const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("file", videoBlob, `wish-video.${ext}`);
      formData.append("bucket", "celebrate-media");
      const upRes = await fetch("/api/celebrate/upload-image", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Upload failed");

      const res = await fetch("/api/wishes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishes_token,
          name,
          relationship,
          message: "",
          media: [{ media_type: "video", file_url: upData.url, caption: `Video wish from ${name}` }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/wishes/${wishes_token}?wished=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("recorded");
    }
  };

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - secondsLeft / MAX_SECONDS);

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(212,160,23,0.08)", color: "rgba(212,160,23,0.5)" }}>
          ←
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text">Record a Video Message</h1>
          <p className="font-serif text-[#f5ead8]/50 text-sm">Up to 30 seconds — say happy birthday!</p>
        </div>
      </div>

      {/* Name fields — always visible so they're filled before sharing */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">About you</p>
        <input type="text" placeholder="Your name *" value={name}
          onChange={(e) => setName(e.target.value)} className={inputClass} style={inputStyle} />
        <input type="text" placeholder="Your relationship (e.g. daughter, old friend…)" value={relationship}
          onChange={(e) => setRelationship(e.target.value)} className={inputClass} style={inputStyle} />
      </div>

      {/* Camera area */}
      <div className="warm-glass rounded-2xl overflow-hidden flex flex-col">
        {/* Live preview / playback */}
        <div className="relative bg-black" style={{ aspectRatio: "9/16", maxHeight: "55vh" }}>
          {(stage === "previewing" || stage === "recording") && (
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} />
          )}
          {(stage === "recorded" || stage === "uploading") && videoUrl && (
            <video ref={playbackRef} src={videoUrl} controls playsInline
              className="w-full h-full object-cover" />
          )}
          {stage === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-20">🎬</span>
            </div>
          )}

          {/* Recording indicator */}
          {stage === "recording" && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-serif text-[10px] text-white/80 tracking-widest">REC</span>
            </div>
          )}

          {/* Countdown ring */}
          {stage === "recording" && (
            <div className="absolute top-3 right-3">
              <svg width="52" height="52">
                <circle cx="26" cy="26" r="20" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle cx="26" cy="26" r="20" fill="none" stroke="#d4a017" strokeWidth="3"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round" transform="rotate(-90 26 26)"
                  style={{ transition: "stroke-dashoffset 1s linear" }} />
                <text x="26" y="30" textAnchor="middle" fontSize="12" fill="white" fontFamily="serif">{secondsLeft}</text>
              </svg>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 flex flex-col items-center gap-4">
          {stage === "idle" && (
            <button type="button" onClick={startPreview}
              className="w-full py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}>
              Open Camera
            </button>
          )}

          {stage === "previewing" && (
            <button type="button" onClick={startRecording}
              className="w-16 h-16 rounded-full text-2xl flex items-center justify-center transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}>
              ●
            </button>
          )}

          {stage === "recording" && (
            <button type="button" onClick={stopRecording}
              className="w-16 h-16 rounded-full text-2xl flex items-center justify-center"
              style={{ background: "rgba(200,60,60,0.2)", border: "2px solid rgba(200,60,60,0.6)" }}>
              ■
            </button>
          )}

          {(stage === "recorded" || stage === "uploading") && (
            <div className="flex gap-3 w-full">
              <button type="button" onClick={reRecord} disabled={stage === "uploading"}
                className="flex-1 py-3 rounded-xl font-serif text-sm transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(212,160,23,0.3)", color: "rgba(212,160,23,0.7)" }}>
                Re-record
              </button>
              <button type="button" onClick={share} disabled={stage === "uploading" || !name.trim()}
                className="flex-1 py-3 rounded-xl font-serif text-sm font-semibold text-[#0f0a04] transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}>
                {stage === "uploading" ? "Sending…" : "Send →"}
              </button>
            </div>
          )}

          {stage === "previewing" && (
            <p className="text-xs font-serif text-gold/30">Tap ● to start recording (max 30 sec)</p>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}
    </div>
  );
}
