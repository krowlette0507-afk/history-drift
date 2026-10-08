"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Stage = "idle" | "previewing" | "recording" | "recorded" | "uploading";

const MAX_SECONDS = 30;

function getBestMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  for (const t of [
    "video/mp4;codecs=h264,aac",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

export default function RecordVideoPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { stopStream(); }, [stopStream]);

  const startPreview = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setStage("previewing");
    } catch {
      setError("Camera access was denied. Please allow camera and microphone access in your browser settings and try again.");
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    const mimeType = getBestMimeType();
    chunksRef.current = [];

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 800_000,
    });

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType });
      setBlob(recorded);
      setBlobUrl(URL.createObjectURL(recorded));
      stopStream();
      setStage("recorded");
    };

    recorder.start(250);
    recorderRef.current = recorder;
    setSecondsLeft(MAX_SECONDS);
    setStage("recording");

    let remaining = MAX_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) stopRecording();
    }, 1000);
  };

  const reRecord = async () => {
    if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
    setBlob(null);
    setStage("idle");
    // small delay so the video element resets before re-acquiring camera
    setTimeout(startPreview, 100);
  };

  const submit = async () => {
    if (!name.trim()) { setError("Please enter your name first."); return; }
    if (!blob) return;
    setStage("uploading");
    setProgress(10);
    setError("");
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `video-message.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "celebrate-media");
      setProgress(30);

      const upRes = await fetch("/api/celebrate/upload-image", { method: "POST", body: formData });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error ?? "Upload failed");
      setProgress(70);

      const res = await fetch("/api/celebrate/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          storyteller_name: name,
          relationship,
          title: `Video message from ${name}`,
          permission_family: true,
          media: [{ media_type: "video", file_url: upData.url, original_filename: file.name }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setProgress(100);
      router.push(`/celebrate/${token}?shared=1`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("recorded");
      setProgress(0);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl font-serif text-sm text-[#f5ead8] placeholder-[#f5ead8]/25 outline-none focus:ring-1 focus:ring-gold/50 transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.2)" };

  // SVG countdown ring
  const radius = 40;
  const circ = 2 * Math.PI * radius;
  const dash = circ * (secondsLeft / MAX_SECONDS);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-xl font-bold text-[#f5ead8] chalk-text mb-1">Record a Video Message</h1>
        <p className="font-serif text-[#f5ead8]/50 text-sm">Up to 30 seconds — just be yourself.</p>
      </div>

      {/* About you */}
      <div className="warm-glass rounded-2xl p-5 flex flex-col gap-3">
        <p className="text-[10px] font-serif uppercase tracking-widest text-gold/40">About you</p>
        <input
          type="text"
          placeholder="Your name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Your relationship (e.g. son, old friend…)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Camera / playback area */}
      <div className="warm-glass rounded-2xl overflow-hidden">
        {/* Live preview */}
        {(stage === "previewing" || stage === "recording") && (
          <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {stage === "recording" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(212,160,23,0.2)" strokeWidth="5" />
                  <circle
                    cx="50" cy="50" r={radius} fill="none" stroke="#d4a017" strokeWidth="5"
                    strokeDasharray={circ}
                    strokeDashoffset={circ - dash}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }}
                  />
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
                    fill="#f5ead8" fontSize="20" fontFamily="serif" fontWeight="bold">
                    {secondsLeft}
                  </text>
                </svg>
              </div>
            )}
            {stage === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-serif text-[10px] text-white/70">REC</span>
              </div>
            )}
          </div>
        )}

        {/* Playback preview after recording */}
        {(stage === "recorded" || stage === "uploading") && blobUrl && (
          <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
            <video
              src={blobUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Idle state */}
        {stage === "idle" && (
          <button
            type="button"
            onClick={startPreview}
            className="w-full flex flex-col items-center justify-center gap-3 py-16 transition-all"
            style={{ background: "rgba(212,160,23,0.03)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(200,132,58,0.1))" }}
            >
              🎬
            </div>
            <span className="font-serif text-sm text-gold/60">Tap to open camera</span>
            <span className="font-serif text-xs text-gold/30">Camera and mic access required</span>
          </button>
        )}

        {/* Action buttons */}
        <div className="p-4 flex flex-col gap-2">
          {stage === "previewing" && (
            <button
              type="button"
              onClick={startRecording}
              className="w-full py-3.5 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
            >
              ● Start Recording
            </button>
          )}

          {stage === "recording" && (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full py-3.5 rounded-xl font-serif font-semibold transition-opacity hover:opacity-90"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
            >
              ■ Stop & Preview
            </button>
          )}

          {stage === "recorded" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reRecord}
                className="flex-1 py-3 rounded-xl font-serif text-sm transition-colors"
                style={{ border: "1px solid rgba(212,160,23,0.2)", color: "rgba(212,160,23,0.55)" }}
              >
                ↺ Re-record
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 py-3 rounded-xl font-serif font-semibold text-[#0f0a04] transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#d4a017 0%,#c8843a 100%)" }}
              >
                Share →
              </button>
            </div>
          )}

          {stage === "uploading" && (
            <div className="flex flex-col gap-2 py-1">
              <div className="rounded-full overflow-hidden h-1.5" style={{ background: "rgba(212,160,23,0.1)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg,#d4a017,#c8843a)" }}
                />
              </div>
              <p className="font-serif text-xs text-gold/40 text-center">Uploading… {progress}%</p>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 font-serif text-sm text-center">{error}</p>}

      <Link
        href={`/celebrate/${token}/share-memory`}
        className="text-center font-serif text-xs text-gold/30 hover:text-gold/60 transition-colors"
      >
        ← Back
      </Link>
    </div>
  );
}
