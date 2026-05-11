/**
 * Generates a shareable PNG ("My app is worth $X according to Rubberduck.space")
 * client-side via canvas, downloads it, and writes shareable text to clipboard.
 */
const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export async function generateShareImage(opts: {
  appName: string;
  valuation: number;
  codeScore: number;
  codeLabel: string;
}) {
  const { appName, valuation, codeScore, codeLabel } = opts;
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0b0f1f");
  grad.addColorStop(0.55, "#161a3a");
  grad.addColorStop(1, "#2a1a4a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Glow blobs
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  blob(900, 120, 380, "rgba(80,120,255,0.45)");
  blob(120, 540, 320, "rgba(180,80,255,0.35)");

  // Top brand bar
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.fillText("🦆  RUBBERDUCK.SPACE", 64, 80);

  // Eyebrow
  ctx.fillStyle = "rgba(180,190,230,0.85)";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText("AI Investment Audit", 64, 180);

  // App name
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px Inter, system-ui, sans-serif";
  const safeName = (appName || "My App").slice(0, 32);
  ctx.fillText(safeName, 64, 250);

  // Valuation hero
  ctx.fillStyle = "#7DD3FC";
  ctx.font = "800 120px Inter, system-ui, sans-serif";
  const valStr = formatUSD(valuation);
  ctx.fillText(valStr, 64, 410);

  // Quote
  ctx.fillStyle = "rgba(220,225,250,0.92)";
  ctx.font = "500 28px Inter, system-ui, sans-serif";
  ctx.fillText(`"My app is worth ${valStr}"`, 64, 470);
  ctx.fillStyle = "rgba(180,190,230,0.7)";
  ctx.font = "400 22px Inter, system-ui, sans-serif";
  ctx.fillText("— according to Rubberduck.space", 64, 502);

  // Code score chip
  const chipX = 64;
  const chipY = 540;
  const chipW = 360;
  const chipH = 60;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.strokeStyle = "rgba(125,211,252,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, chipX, chipY, chipW, chipH, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7DD3FC";
  ctx.font = "700 26px Inter, system-ui, sans-serif";
  ctx.fillText(`Code Health  ${codeScore}/100`, chipX + 20, chipY + 40);
  ctx.fillStyle = "rgba(220,225,250,0.85)";
  ctx.font = "500 18px Inter, system-ui, sans-serif";
  ctx.fillText(codeLabel, chipX + chipW + 20, chipY + 40);

  // Footer URL
  ctx.fillStyle = "rgba(180,190,230,0.7)";
  ctx.font = "500 20px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("rubberduck.space  →  Audit your repo", W - 64, H - 48);
  ctx.textAlign = "left";

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
