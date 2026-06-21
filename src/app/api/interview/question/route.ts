import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestion } from "@/lib/openai";
import { PhaseId } from "@/lib/interview-config";

export async function POST(req: NextRequest) {
  try {
    const { interviewerId, messages, profileContext, currentPhase, askedQuestions } = await req.json();

    if (!interviewerId || !messages) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const question = await generateInterviewQuestion(
      interviewerId,
      messages,
      profileContext || "",
      (currentPhase as PhaseId) || "hook",
      Array.isArray(askedQuestions) ? askedQuestions : []
    );
    return NextResponse.json({ question });
  } catch (error) {
    console.error("Interview question error:", error);
    return NextResponse.json(
      { error: "Failed to generate question", question: "What's one moment from your life that changed everything — big or small?" },
      { status: 500 }
    );
  }
}
