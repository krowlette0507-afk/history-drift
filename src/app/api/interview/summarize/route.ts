import { NextRequest, NextResponse } from "next/server";
import { summarizeInterview, summarizeTranscript } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // New format: {messages, interviewerName}
    if (body.messages && Array.isArray(body.messages)) {
      const summary = await summarizeInterview(body.messages, body.interviewerName || "Interviewer");
      return NextResponse.json({ summary });
    }

    // Legacy format: {transcript}
    if (body.transcript) {
      const result = await summarizeTranscript(body.transcript);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Missing messages or transcript" }, { status: 400 });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ error: "Failed to summarize interview" }, { status: 500 });
  }
}
