import { jsPDF } from "jspdf";
import type { TFunction } from "i18next";
import type { AiValuationReport, ValuationInputs } from "@/hooks/useAiValuation";

const ROBOTO_REGULAR_TTF =
  "https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Regular.ttf";
const ROBOTO_BOLD_TTF =
  "https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Bold.ttf";

let cachedRegular: string | null = null;
let cachedBold: string | null = null;

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
  const buf = await res.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ensureUnicodeFont(doc: jsPDF) {
  try {
    if (!cachedRegular) cachedRegular = await fetchAsBase64(ROBOTO_REGULAR_TTF);
    if (!cachedBold) cachedBold = await fetchAsBase64(ROBOTO_BOLD_TTF);
    doc.addFileToVFS("Roboto-Regular.ttf", cachedRegular);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFileToVFS("Roboto-Bold.ttf", cachedBold);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");
    return true;
  } catch (err) {
    console.warn("[exportInvestorPdf] Falling back to Helvetica:", err);
    doc.setFont("helvetica", "normal");
    return false;
  }
}

const PAGE_MARGIN_X = 56;
const PAGE_MARGIN_TOP = 64;
const PAGE_MARGIN_BOTTOM = 56;

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

type Ctx = {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  hasUnicode: boolean;
};

function font(ctx: Ctx, weight: "normal" | "bold", size: number) {
  ctx.doc.setFont(ctx.hasUnicode ? "Roboto" : "helvetica", weight);
  ctx.doc.setFontSize(size);
}

function ensure(ctx: Ctx, h: number) {
  if (ctx.y + h > ctx.pageHeight - PAGE_MARGIN_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = PAGE_MARGIN_TOP;
  }
}

function wrap(ctx: Ctx, text: string, lh = 16, gap = 0) {
  const lines = ctx.doc.splitTextToSize(text, ctx.contentWidth) as string[];
  for (const line of lines) {
    ensure(ctx, lh);
    ctx.doc.text(line, PAGE_MARGIN_X, ctx.y);
    ctx.y += lh;
  }
  if (gap) ctx.y += gap;
}

function divider(ctx: Ctx) {
  ctx.doc.setDrawColor(225, 225, 232);
  ctx.doc.line(PAGE_MARGIN_X, ctx.y, ctx.pageWidth - PAGE_MARGIN_X, ctx.y);
  ctx.y += 14;
}

function sectionTitle(ctx: Ctx, label: string) {
  ensure(ctx, 28);
  font(ctx, "bold", 13);
  ctx.doc.setTextColor(20, 20, 28);
  ctx.doc.text(label.toUpperCase(), PAGE_MARGIN_X, ctx.y);
  ctx.y += 16;
  ctx.doc.setDrawColor(80, 90, 240);
  ctx.doc.setLineWidth(2);
  ctx.doc.line(PAGE_MARGIN_X, ctx.y - 6, PAGE_MARGIN_X + 36, ctx.y - 6);
  ctx.doc.setLineWidth(0.5);
  ctx.y += 4;
}

function footer(doc: jsPDF, hasUnicode: boolean, t: TFunction) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 158);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(
      `${t("valuation.pdf.footerBrand")}  ·  ${i} / ${n}  ·  ${t("valuation.pdf.confidential")}`,
      w / 2,
      h - 24,
      { align: "center" },
    );
  }
}

export async function exportInvestorPdf(
  t: TFunction,
  locale: string,
  report: AiValuationReport,
  inputs: ValuationInputs,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const hasUnicode = await ensureUnicodeFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ctx: Ctx = {
    doc,
    y: PAGE_MARGIN_TOP,
    pageWidth,
    pageHeight,
    contentWidth: pageWidth - PAGE_MARGIN_X * 2,
    hasUnicode,
  };

  // ===== COVER =====
  doc.setFillColor(15, 18, 36);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(80, 90, 240);
  doc.rect(0, 0, pageWidth, 6, "F");

  font(ctx, "bold", 11);
  doc.setTextColor(180, 185, 220);
  doc.text("RUBBERDUCK.SPACE", PAGE_MARGIN_X, 90);

  font(ctx, "normal", 10);
  doc.setTextColor(140, 145, 175);
  doc.text(t("valuation.pdf.coverEyebrow"), PAGE_MARGIN_X, 108);

  font(ctx, "bold", 32);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(
    inputs.name || t("valuation.untitled"),
    ctx.contentWidth,
  ) as string[];
  let coverY = 200;
  titleLines.forEach((l) => {
    doc.text(l, PAGE_MARGIN_X, coverY);
    coverY += 38;
  });

  font(ctx, "normal", 14);
  doc.setTextColor(160, 170, 210);
  doc.text(t("valuation.pdf.coverSubtitle"), PAGE_MARGIN_X, coverY + 10);

  // Hero valuation
  font(ctx, "bold", 48);
  doc.setTextColor(120, 200, 255);
  doc.text(formatUSD(report.estimated_valuation.mid), PAGE_MARGIN_X, coverY + 100);

  font(ctx, "normal", 11);
  doc.setTextColor(160, 170, 210);
  doc.text(
    `${formatUSD(report.estimated_valuation.low)} – ${formatUSD(report.estimated_valuation.high)}  ·  ${t("valuation.pdf.range")}`,
    PAGE_MARGIN_X,
    coverY + 122,
  );

  // Footer of cover
  font(ctx, "normal", 9);
  doc.setTextColor(110, 120, 160);
  const dateStr = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date());
  doc.text(
    `${t("valuation.pdf.preparedOn")} ${dateStr}`,
    PAGE_MARGIN_X,
    pageHeight - 56,
  );
  doc.text(
    "rubberduck.space",
    pageWidth - PAGE_MARGIN_X,
    pageHeight - 56,
    { align: "right" },
  );

  // ===== PAGE 2: Executive Summary =====
  doc.addPage();
  ctx.y = PAGE_MARGIN_TOP;
  doc.setTextColor(30, 30, 34);

  sectionTitle(ctx, t("valuation.pdf.execSummary"));
  font(ctx, "normal", 11);
  doc.setTextColor(60, 60, 70);
  wrap(ctx, report.summary, 16, 12);

  sectionTitle(ctx, t("valuation.pdf.financials"));
  const rows: [string, string][] = [
    [t("valuation.monthlyMRR"), formatUSD(inputs.mrr)],
    [t("valuation.monthlyExpenses"), `− ${formatUSD(inputs.expenses)}`],
    [t("valuation.netProfit"), formatUSD(inputs.mrr - inputs.expenses)],
    [t("valuation.ai.report.multiple"), report.multiple > 0 ? `${report.multiple.toFixed(1)}×` : "—"],
    [t("valuation.niche"), inputs.niche],
    [t("valuation.ai.report.risk"), `${report.risk_score}/10`],
  ];
  font(ctx, "normal", 11);
  for (const [k, v] of rows) {
    ensure(ctx, 18);
    doc.setTextColor(110, 110, 122);
    doc.text(k, PAGE_MARGIN_X, ctx.y);
    doc.setTextColor(20, 20, 28);
    doc.text(v, ctx.pageWidth - PAGE_MARGIN_X, ctx.y, { align: "right" });
    ctx.y += 18;
  }
  ctx.y += 6;
  divider(ctx);

  // ===== Code Health =====
  sectionTitle(ctx, t("valuation.pdf.codeHealth"));
  font(ctx, "bold", 28);
  doc.setTextColor(80, 90, 240);
  doc.text(`${report.code_quality_score}/100`, PAGE_MARGIN_X, ctx.y + 8);
  font(ctx, "normal", 11);
  doc.setTextColor(110, 110, 122);
  doc.text(report.code_quality_label, PAGE_MARGIN_X + 130, ctx.y + 8);
  ctx.y += 28;

  // bar
  const barW = ctx.contentWidth;
  doc.setFillColor(235, 237, 245);
  doc.rect(PAGE_MARGIN_X, ctx.y, barW, 6, "F");
  doc.setFillColor(80, 90, 240);
  doc.rect(PAGE_MARGIN_X, ctx.y, (barW * report.code_quality_score) / 100, 6, "F");
  ctx.y += 22;

  font(ctx, "normal", 10);
  doc.setTextColor(80, 80, 90);
  wrap(ctx, report.tech_stack_audit.summary, 14, 14);

  // detected stack chips
  if (report.tech_stack_audit.detected_stack?.length) {
    font(ctx, "bold", 9);
    doc.setTextColor(110, 110, 122);
    ensure(ctx, 18);
    doc.text(t("valuation.ai.report.detectedStack").toUpperCase(), PAGE_MARGIN_X, ctx.y);
    ctx.y += 14;
    font(ctx, "normal", 10);
    doc.setTextColor(40, 40, 50);
    wrap(ctx, report.tech_stack_audit.detected_stack.join("  ·  "), 14, 12);
  }

  // ===== Tech Excellence + Debt =====
  sectionTitle(ctx, t("valuation.ai.report.techExcellence"));
  font(ctx, "normal", 11);
  doc.setTextColor(40, 130, 70);
  for (const item of report.tech_stack_audit.excellence) {
    ensure(ctx, 16);
    doc.text(`✓  ${item}`, PAGE_MARGIN_X, ctx.y);
    ctx.y += 16;
  }
  ctx.y += 6;

  sectionTitle(ctx, t("valuation.ai.report.techDebt"));
  doc.setTextColor(180, 60, 60);
  for (const item of report.tech_stack_audit.tech_debt) {
    ensure(ctx, 16);
    doc.text(`!  ${item}`, PAGE_MARGIN_X, ctx.y);
    ctx.y += 16;
  }
  ctx.y += 8;

  // ===== Refactor + Value-up tips =====
  doc.addPage();
  ctx.y = PAGE_MARGIN_TOP;

  sectionTitle(ctx, t("valuation.ai.report.refactorTips"));
  for (const tip of report.refactor_tips ?? []) {
    ensure(ctx, 40);
    font(ctx, "bold", 11);
    doc.setTextColor(20, 20, 28);
    doc.text(`• ${tip.title}`, PAGE_MARGIN_X, ctx.y);
    ctx.y += 14;
    font(ctx, "normal", 10);
    doc.setTextColor(80, 80, 92);
    wrap(ctx, tip.detail, 13, 8);
  }

  sectionTitle(ctx, t("valuation.ai.report.valueUpTips"));
  for (const tip of report.value_up_tips ?? []) {
    ensure(ctx, 40);
    font(ctx, "bold", 11);
    doc.setTextColor(20, 20, 28);
    doc.text(`• ${tip.title}`, PAGE_MARGIN_X, ctx.y);
    ctx.y += 14;
    font(ctx, "normal", 10);
    doc.setTextColor(80, 80, 92);
    wrap(ctx, tip.detail, 13, 8);
  }

  // Disclaimer
  ensure(ctx, 60);
  ctx.y += 12;
  divider(ctx);
  font(ctx, "normal", 8);
  doc.setTextColor(140, 140, 150);
  wrap(ctx, t("valuation.pdf.disclaimer"), 11, 0);

  footer(doc, hasUnicode, t);

  const slug = (inputs.name || "investment-deck")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`rubberduck-deck-${slug}.pdf`);
}
