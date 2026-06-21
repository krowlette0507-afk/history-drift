import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { question, profileId, transcripts, profileName } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const effectiveTranscripts = transcripts || [
      "No interviews have been completed yet for this profile.",
    ];
    const effectiveName = profileName || "the subject";

    const answer = await answerQuestion(question, effectiveTranscripts, effectiveName);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Ask error:", error);
    return NextResponse.json({ error: "Failed to answer question" }, { status: 500 });
  }
}
