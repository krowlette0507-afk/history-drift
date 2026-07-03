import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      {
        headers: { "X-Api-Key": process.env.HEYGEN_API_KEY! },
      }
    );

    const data = await res.json();
    const video = data.data;

    return NextResponse.json({
      status: video.status, // "pending" | "processing" | "completed" | "failed"
      videoUrl: video.video_url ?? null,
      thumbnailUrl: video.thumbnail_url ?? null,
    });
  } catch (err) {
    console.error("HeyGen status error:", err);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
