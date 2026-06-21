import { NextRequest, NextResponse } from "next/server";
import { extractMemoriesFromAnswer } from "@/lib/openai";
import { PhaseId } from "@/lib/interview-config";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, phase, existingContext } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }

    const memory = await extractMemoriesFromAnswer(
      question,
      answer,
      (phase || "hook") as PhaseId,
      existingContext || ""
    );

    return NextResponse.json({ memory });
  } catch (error) {
    console.error("Memory extraction error:", error);
    return NextResponse.json({ error: "Failed to extract memories" }, { status: 500 });
  }
}
