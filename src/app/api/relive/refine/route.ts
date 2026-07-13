import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { rawStory, subjectName } = await req.json();

    if (!rawStory || rawStory.trim().length < 20) {
      return NextResponse.json({ error: "Story too short to refine." }, { status: 400 });
    }

    const subject = subjectName?.trim() || "the subject";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a story editor and visual narrative specialist for a life story storyboard app called History Drift.
Your job is to take a rough spoken or written story and:
1. Clean it up into vivid, flowing narrative prose — fix grammar, remove filler words, improve flow. Keep the voice authentic.
2. Identify 2-3 clarifying questions that would make the story richer for illustration (names, ages, settings, emotional details, sensory details). Keep questions concise and warm.
3. Identify the ${12} most visually compelling moments that would make the best storyboard panels. For each, write a one-sentence panel description in present tense (8-14 words, vivid, storybook style).

Return ONLY valid JSON in this exact shape:
{
  "cleanedStory": "...",
  "questions": ["...", "...", "..."],
  "panelMoments": [
    { "n": 1, "moment": "..." },
    ...
  ]
}`,
        },
        {
          role: "user",
          content: `Subject name: ${subject}\n\nRaw story:\n${rawStory}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Refine error:", err);
    return NextResponse.json({ error: "Failed to refine story." }, { status: 500 });
  }
}
