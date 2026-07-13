import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  analyzeReferenceImage,
  planReliveStoryboard,
  generateReliveImage,
  generatePanelImage,
  ReliveAgeStage,
  ReliveArtStyle,
} from "@/lib/openai";
import {
  composePremiumStoryboard,
  addFreeTierOverlay,
  CompositorPanel,
} from "@/lib/storyboard-composer";

export const maxDuration = 300; // 5 minutes — requires Vercel Pro for premium tier

function sse(controller: ReadableStreamDefaultController, data: object) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  );
}

export async function POST(req: NextRequest) {
  const {
    storyContent,
    subjectName,
    referenceImageBase64,
    ageStage,
    artStyle,
    panelCount,
    sessionId,
    tier = "free",
  } = await req.json();

  // Resolve userId from Bearer token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any;
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authHeader.slice(7));
    userId = data.user?.id ?? null;
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!storyContent || storyContent.trim().length < 50) {
          sse(controller, { type: "error", message: "Story content is too short." });
          controller.close();
          return;
        }

        // Step 1: Analyze reference photo
        sse(controller, { type: "progress", step: 1, message: "Analyzing your reference photo…" });
        let character = null;
        if (referenceImageBase64) {
          try {
            character = await analyzeReferenceImage(referenceImageBase64);
          } catch { /* non-fatal */ }
        }

        // Step 2: Plan narrative
        sse(controller, { type: "progress", step: 2, message: "Mapping your story into scenes…" });
        const plan = await planReliveStoryboard(
          storyContent,
          subjectName || "the subject",
          ageStage as ReliveAgeStage,
          panelCount as 12 | 14 | 16
        );

        let finalImageBuffer: Buffer;

        if (tier === "premium") {
          // ── Premium: generate each panel individually then composite ──
          const totalPanels = plan.panels.length;
          sse(controller, { type: "progress", step: 3, message: `Generating ${totalPanels} high-quality panels…`, total: totalPanels });

          const BATCH = 3; // generate 3 panels at a time
          const compositorPanels: CompositorPanel[] = new Array(totalPanels);

          for (let i = 0; i < totalPanels; i += BATCH) {
            const batch = plan.panels.slice(i, i + BATCH);
            const results = await Promise.allSettled(
              batch.map((p) =>
                generatePanelImage(p, character, subjectName || "the subject", ageStage as ReliveAgeStage, artStyle as ReliveArtStyle)
              )
            );
            for (let j = 0; j < results.length; j++) {
              const panelIndex = i + j;
              const panel = batch[j];
              const result = results[j];
              if (result.status === "fulfilled") {
                compositorPanels[panelIndex] = {
                  imageBuffer: Buffer.from(result.value, "base64"),
                  number: panel.number,
                  title: panel.title,
                  bullets: panel.bullets,
                  timePeriod: panel.timePeriod,
                };
                sse(controller, { type: "panel_done", panelNumber: panel.number, total: totalPanels });
              } else {
                // Panel failed — use a placeholder dark image
                const placeholder = Buffer.from(
                  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                  "base64"
                );
                compositorPanels[panelIndex] = {
                  imageBuffer: placeholder,
                  number: panel.number,
                  title: panel.title,
                  bullets: panel.bullets,
                  timePeriod: panel.timePeriod,
                };
              }
            }
          }

          // Composite into final storyboard
          sse(controller, { type: "progress", step: 4, message: "Compositing your storyboard…" });
          finalImageBuffer = await composePremiumStoryboard(
            compositorPanels,
            plan.title,
            plan.subtitle,
            subjectName || ""
          );
        } else {
          // ── Free: single composite image + title overlay ──
          sse(controller, { type: "progress", step: 3, message: "Generating your illustrated storyboard…" });
          const b64 = await generateReliveImage(
            plan,
            character,
            subjectName || "the subject",
            ageStage as ReliveAgeStage,
            artStyle as ReliveArtStyle,
            panelCount as 12 | 14 | 16
          );
          sse(controller, { type: "progress", step: 4, message: "Adding finishing touches…" });
          finalImageBuffer = await addFreeTierOverlay(
            Buffer.from(b64, "base64"),
            plan.title,
            plan.subtitle
          );
        }

        // Upload to Supabase Storage
        sse(controller, { type: "progress", step: 5, message: "Saving your storyboard…" });
        const folderName = userId ?? "anonymous";
        const fileName = `${folderName}/${Date.now()}_${tier}.jpg`;
        let imageUrl: string | null = null;

        try {
          const { error: uploadErr } = await supabase.storage
            .from("relive-media")
            .upload(fileName, finalImageBuffer, { contentType: "image/jpeg", upsert: false });
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from("relive-media").getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        } catch { /* non-fatal */ }

        // Save DB record
        let storyboardId: string | null = null;
        if (userId) {
          try {
            const { data: record } = await supabase
              .from("relive_storyboards")
              .insert({
                user_id: userId,
                session_id: sessionId || null,
                subject_name: subjectName || null,
                age_stage: ageStage,
                art_style: artStyle,
                panel_count: panelCount,
                title: plan.title,
                subtitle: plan.subtitle,
                image_url: imageUrl,
                character_profile: character,
                storyboard_plan: plan,
                status: "completed",
              })
              .select("id")
              .single();
            storyboardId = record?.id ?? null;
          } catch { /* non-fatal */ }
        }

        // Send final result
        sse(controller, {
          type: "complete",
          storyboardId,
          imageUrl,
          imageB64: imageUrl ? null : finalImageBuffer.toString("base64"),
          title: plan.title,
          subtitle: plan.subtitle,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed";
        console.error("Re-Live error:", err);
        sse(controller, { type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
