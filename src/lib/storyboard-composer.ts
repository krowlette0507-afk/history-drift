/**
 * Sharp-based storyboard compositor.
 * Premium tier: individual panel images → full illustrated grid with
 * circled panel numbers + caption strips, matching the ChatGPT storyboard aesthetic.
 * Free tier: title bar overlay on a single composite image.
 */
import sharp from "sharp";

export interface CompositorPanel {
  imageBuffer: Buffer;
  number: number;
  title: string;
  bullets: string[];
  timePeriod: string;
}

// ── Layout constants ────────────────────────────────────────────────
const COLS      = 4;
const CANVAS_W  = 2400;
const PAD_X     = 16;
const PAD_Y     = 16;
const GAP_X     = 8;
const GAP_Y     = 8;
const HEADER_H  = 120;
const ILLUST_H  = 400;   // illustration area per panel
const CAPTION_H = 190;   // tall caption strip — readable text, full descriptions
const PANEL_H   = ILLUST_H + CAPTION_H;
const PANEL_W   = Math.floor((CANVAS_W - PAD_X * 2 - GAP_X * (COLS - 1)) / COLS);

function totalCanvasH(panelCount: number) {
  const rows = Math.ceil(panelCount / COLS);
  return HEADER_H + PAD_Y + rows * PANEL_H + (rows - 1) * GAP_Y + PAD_Y;
}

function panelXY(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: PAD_X + col * (PANEL_W + GAP_X),
    y: HEADER_H + PAD_Y + row * (PANEL_H + GAP_Y),
  };
}

function xe(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ── SVG overlay ────────────────────────────────────────────────────
function buildOverlaySvg(
  panels: CompositorPanel[],
  title: string,
  subtitle: string,
  characterName: string,
  canvasH: number
): string {
  const header = `
    <rect x="0" y="0" width="${CANVAS_W}" height="${HEADER_H}" fill="#0d0701"/>
    <rect x="0" y="${HEADER_H - 3}" width="${CANVAS_W}" height="3" fill="#7a2d8a"/>
    <text x="32" y="76" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="#f0d060" letter-spacing="2">${xe(title)}</text>
    <text x="34" y="114" font-family="Georgia,serif" font-size="20" fill="#c8843a" letter-spacing="1.5">${xe(subtitle)}</text>
    <text x="${CANVAS_W - 32}" y="68" font-family="Arial,sans-serif" font-size="12" fill="#6a4020" text-anchor="end" letter-spacing="1">RE-LIVE · HISTORY DRIFT</text>
    ${characterName ? `<text x="${CANVAS_W - 32}" y="90" font-family="Arial,sans-serif" font-size="13" fill="#9a6838" text-anchor="end">${xe(characterName)}</text>` : ""}
  `;

  const panelOverlays = panels.map((panel, i) => {
    const { x: px, y: py } = panelXY(i);
    const captionY = py + ILLUST_H;
    const cx = px + PANEL_W / 2;

    // Caption strip — white background, dark text (ChatGPT style)
    const captionBg = `<rect x="${px}" y="${captionY}" width="${PANEL_W}" height="${CAPTION_H}" fill="#f8f4ee"/>`;
    const divider   = `<line x1="${px}" y1="${captionY}" x2="${px + PANEL_W}" y2="${captionY}" stroke="#d0c8b8" stroke-width="1"/>`;

    // Bold title + word-wrapped description across up to 3 lines
    const line1 = trunc(panel.title, 38);
    // Use first two bullets for a fuller description
    const fullDesc = [panel.bullets[0], panel.bullets[1]].filter(Boolean).join(" ");
    const descText = trunc(fullDesc || "", 160);
    const words = descText.split(" ");
    let dL1 = "", dL2 = "", dL3 = "";
    for (const w of words) {
      if ((dL1 + " " + w).trim().length <= 38) dL1 = (dL1 + " " + w).trim();
      else if ((dL2 + " " + w).trim().length <= 38) dL2 = (dL2 + " " + w).trim();
      else dL3 = (dL3 + " " + w).trim();
    }
    const captionText = `
      <text x="${px + 14}" y="${captionY + 34}" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#1a1208">${xe(line1)}</text>
      ${dL1 ? `<text x="${px + 14}" y="${captionY + 66}" font-family="Arial,sans-serif" font-size="18" fill="#3a2e1a">${xe(dL1)}</text>` : ""}
      ${dL2 ? `<text x="${px + 14}" y="${captionY + 92}" font-family="Arial,sans-serif" font-size="18" fill="#3a2e1a">${xe(dL2)}</text>` : ""}
      ${dL3 ? `<text x="${px + 14}" y="${captionY + 118}" font-family="Arial,sans-serif" font-size="18" fill="#3a2e1a">${xe(dL3)}</text>` : ""}
      <text x="${px + 14}" y="${captionY + 168}" font-family="Arial,sans-serif" font-size="13" fill="#8a7a5a" letter-spacing="0.5">${xe(panel.timePeriod)}</text>
    `;

    // Circled number badge — top-left of illustration
    const r   = 22;
    const ncx = px + r + 10;
    const ncy = py + r + 10;
    const badge = `
      <circle cx="${ncx}" cy="${ncy}" r="${r}" fill="rgba(255,255,255,0.93)"/>
      <text x="${ncx}" y="${ncy + 7}" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#111" text-anchor="middle">${panel.number}</text>
    `;

    const border = `<rect x="${px}" y="${py}" width="${PANEL_W}" height="${PANEL_H}" fill="none" stroke="#2a1005" stroke-width="1.5"/>`;

    return captionBg + divider + captionText + badge + border;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${canvasH}">
    ${header}
    ${panelOverlays.join("")}
  </svg>`;
}

// ── Premium compositor ─────────────────────────────────────────────
export async function composePremiumStoryboard(
  panels: CompositorPanel[],
  title: string,
  subtitle: string,
  characterName: string
): Promise<Buffer> {
  const h = totalCanvasH(panels.length);

  const base = await sharp({
    create: { width: CANVAS_W, height: h, channels: 4, background: { r: 14, g: 8, b: 2, alpha: 255 } },
  }).png().toBuffer();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageComposites: any[] = [];
  for (let i = 0; i < panels.length; i++) {
    const { x: px, y: py } = panelXY(i);
    const resized = await sharp(panels[i].imageBuffer)
      .resize(PANEL_W, ILLUST_H, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
    imageComposites.push({ input: resized, left: px, top: py });
  }

  const svg = buildOverlaySvg(panels, title, subtitle, characterName, h);

  return sharp(base)
    .composite([...imageComposites, { input: Buffer.from(svg), left: 0, top: 0 }])
    .jpeg({ quality: 96 })
    .toBuffer();
}

// ── Free tier overlay ──────────────────────────────────────────────
export async function addFreeTierOverlay(
  imageBuffer: Buffer,
  title: string,
  subtitle: string
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w    = meta.width ?? 1536;
  const barH = 72;

  function x(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${barH}">
    <rect x="0" y="0" width="${w}" height="${barH}" fill="rgba(8,4,1,0.90)"/>
    <rect x="0" y="${barH - 2}" width="${w}" height="2" fill="#7a2d8a"/>
    <text x="22" y="40" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="#f0d060" letter-spacing="1.5">${x(title)}</text>
    <text x="22" y="62" font-family="Georgia,serif" font-size="14" fill="#c8843a" letter-spacing="0.8">${x(subtitle)}</text>
    <text x="${w - 18}" y="38" font-family="Arial,sans-serif" font-size="10" fill="#6a5020" text-anchor="end">Re-Live · History Drift</text>
  </svg>`;

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
