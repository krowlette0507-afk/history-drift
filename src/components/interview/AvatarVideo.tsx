"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  videoId: string | null;
  accentColor: string;
  interviewerName: string;
  onReady?: () => void;
}

export default function AvatarVideo({ videoId, accentColor, interviewerName, onReady }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "polling" | "ready" | "failed">("idle");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoId) {
      setStatus("idle");
      setVideoUrl(null);
      return;
    }

    setStatus("polling");
    setVideoUrl(null);

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 5 minutes at 5s intervals

    const poll = async () => {
      try {
        const res = await fetch(`/api/heygen/status?videoId=${encodeURIComponent(videoId)}`);
        const data = await res.json();

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setStatus("ready");
          onReady?.();
          return;
        }

        if (data.status === "failed" || attempts >= MAX_ATTEMPTS) {
          setStatus("failed");
          return;
        }

        attempts++;
        pollRef.current = setTimeout(poll, 5000);
      } catch {
        if (attempts < MAX_ATTEMPTS) {
          attempts++;
          pollRef.current = setTimeout(poll, 5000);
        } else {
          setStatus("failed");
        }
      }
    };

    poll();

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [videoId, onReady]);

  if (status === "idle" || !videoId) return null;

  if (status === "failed") {
    return (
      <div className="w-full aspect-square flex items-center justify-center rounded-xl"
        style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}>
        <p className="text-sm text-white/50">Video unavailable</p>
      </div>
    );
  }

  if (status === "polling" || !videoUrl) {
    return (
      <div className="w-full aspect-square flex flex-col items-center justify-center gap-3 rounded-xl"
        style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44` }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${accentColor}88`, borderTopColor: "transparent" }} />
        <p className="text-xs text-white/50">Preparing {interviewerName}…</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      autoPlay
      playsInline
      className="w-full aspect-square object-cover rounded-xl"
    />
  );
}
