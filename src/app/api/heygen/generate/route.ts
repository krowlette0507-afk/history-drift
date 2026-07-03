import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, avatarId, voiceId } = await req.json();
    if (!text || !avatarId || !voiceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch("https://api.heygen.com/v2/video/generate", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_inputs: [{
          character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
          voice: { type: "text", input_text: text, voice_id: voiceId },
        }],
        dimension: { width: 720, height: 720 },
      }),
    });

    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });
    return NextResponse.json({ videoId: data.data.video_id });
  } catch (err) {
    console.error("HeyGen generate error:", err);
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 });
  }
}
