"use client";

import { Interviewer } from "@/data/interviewers";

interface Props {
  interviewer: Interviewer;
  size?: number;
}

// Map interviewer IDs to their photo files
const PHOTO_MAP: Record<string, string> = {
  dr_james_carter:    "/images/interviewers/dr-carter.jpg",
  professor_mei_lin:  "/images/interviewers/prof-mei-lin.jpg",
  sarah_bennett:      "/images/interviewers/sarah-bennett.jpg",
  miguel_alvarez:     "/images/interviewers/miguel-alvarez.jpg",
  jordan_brooks:      "/images/interviewers/jordan-brooks.jpg",
};

export default function InterviewerPortrait({ interviewer, size = 200 }: Props) {
  const photoSrc = PHOTO_MAP[interviewer.id];
  const objectPosition = "center 20%";
  const height = Math.round(size * 1.3);

  if (photoSrc) {
    return (
      <div
        style={{
          width: size,
          height,
          overflow: "hidden",
          borderRadius: "10px",
          display: "block",
          flexShrink: 0,
        }}
      >
        <img
          src={photoSrc}
          alt={interviewer.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            display: "block",
          }}
        />
      </div>
    );
  }

  // Fallback: initials avatar
  return (
    <div
      style={{
        width: size,
        height,
        borderRadius: "10px",
        background: `linear-gradient(135deg, ${interviewer.accentColor}33, ${interviewer.accentColor}11)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: size * 0.22,
          fontWeight: "bold",
          color: interviewer.accentColor,
          fontFamily: "serif",
        }}
      >
        {interviewer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
      </span>
    </div>
  );
}
