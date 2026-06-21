import { NextRequest, NextResponse } from "next/server";
import { generateBiography } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { profileId, style, transcripts, profileName } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    // In production, fetch transcripts from Supabase using profileId
    const effectiveTranscripts = transcripts || [
      "This is a placeholder interview transcript. The subject has not yet completed any interviews.",
    ];
    const effectiveName = profileName || "the subject";

    const biography = await generateBiography(effectiveName, effectiveTranscripts, style || "full");
    return NextResponse.json({ biography });
  } catch (error) {
    console.error("Biography generation error:", error);
    return NextResponse.json({ error: "Failed to generate biography" }, { status: 500 });
  }
}
