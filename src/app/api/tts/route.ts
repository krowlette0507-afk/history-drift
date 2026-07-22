import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type OAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
const VALID_VOICES: OAIVoice[] = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

export async function POST(req: NextRequest) {
  try {
    const { text, voice, instructions } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const safeVoice: OAIVoice = VALID_VOICES.includes(voice) ? voice : "alloy";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mp3 = await (openai.audio.speech.create as any)({
      model: "gpt-4o-mini-tts",
      voice: safeVoice,
      input: text.slice(0, 4096),
      ...(instructions ? { instructions } : {}),
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }
}
