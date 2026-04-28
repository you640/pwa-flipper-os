import type { TFunction } from "i18next";
import { jsPDF } from "jspdf";

/**
 * jsPDF built-in fonts (Helvetica/Times/Courier) only cover WinAnsi and break on
 * Slovak diacritics (ľ, š, č, ť, ž, ý, á, í, ô, ä, ...). To render Slovak (and
 * any other UTF-8) text correctly we lazy-fetch a Unicode TTF (Roboto) once,
 * cache it as base64, and register it with jsPDF before drawing any text.
 */

const _ROBOTO_REGULAR_URL =
	"https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.13/files/roboto-latin-ext-400-normal.woff";
// We need a TTF, not WOFF — jsPDF can't parse WOFF. Use the unpkg TTF mirror.
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
		console.warn("[exportDocsPdf] Falling back to Helvetica:", err);
		doc.setFont("helvetica", "normal");
		return false;
	}
}

const PAGE_MARGIN_X = 56;
const PAGE_MARGIN_TOP = 64;
const PAGE_MARGIN_BOTTOM = 56;
const LINE_HEIGHT = 16;

type DocCtx = {
	doc: jsPDF;
	y: number;
	pageWidth: number;
	pageHeight: number;
	contentWidth: number;
	hasUnicode: boolean;
};

function newCtx(doc: jsPDF, hasUnicode: boolean): DocCtx {
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	return {
		doc,
		y: PAGE_MARGIN_TOP,
		pageWidth,
		pageHeight,
		contentWidth: pageWidth - PAGE_MARGIN_X * 2,
		hasUnicode,
	};
}

function setFont(ctx: DocCtx, weight: "normal" | "bold", size: number) {
	ctx.doc.setFont(ctx.hasUnicode ? "Roboto" : "helvetica", weight);
	ctx.doc.setFontSize(size);
}

function ensureSpace(ctx: DocCtx, needed: number) {
	if (ctx.y + needed > ctx.pageHeight - PAGE_MARGIN_BOTTOM) {
		ctx.doc.addPage();
		ctx.y = PAGE_MARGIN_TOP;
	}
}

function writeWrapped(ctx: DocCtx, text: string, opts?: { gap?: number }) {
	const lines = ctx.doc.splitTextToSize(text, ctx.contentWidth) as string[];
	for (const line of lines) {
		ensureSpace(ctx, LINE_HEIGHT);
		ctx.doc.text(line, PAGE_MARGIN_X, ctx.y);
		ctx.y += LINE_HEIGHT;
	}
	if (opts?.gap) ctx.y += opts.gap;
}

function drawHeader(
	ctx: DocCtx,
	title: string,
	subtitle: string,
	locale: string,
) {
	setFont(ctx, "bold", 18);
	ctx.doc.setTextColor(20, 20, 24);
	ctx.doc.text("RUBBERDUCK.SPACE", PAGE_MARGIN_X, ctx.y);
	ctx.y += 22;

	setFont(ctx, "bold", 14);
	ctx.doc.setTextColor(40, 40, 48);
	ctx.doc.text(title, PAGE_MARGIN_X, ctx.y);
	ctx.y += 18;

	setFont(ctx, "normal", 10);
	ctx.doc.setTextColor(120, 120, 128);
	const dateStr = new Intl.DateTimeFormat(locale, {
		dateStyle: "long",
	}).format(new Date());
	ctx.doc.text(`${subtitle} · ${dateStr}`, PAGE_MARGIN_X, ctx.y);
	ctx.y += 14;

	// separator
	ctx.doc.setDrawColor(220, 220, 226);
	ctx.doc.line(PAGE_MARGIN_X, ctx.y, ctx.pageWidth - PAGE_MARGIN_X, ctx.y);
	ctx.y += 18;
	ctx.doc.setTextColor(30, 30, 34);
}

function drawFooter(doc: jsPDF, hasUnicode: boolean) {
	const pageCount = doc.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFont(hasUnicode ? "Roboto" : "helvetica", "normal");
		doc.setFontSize(9);
		doc.setTextColor(150, 150, 158);
		const w = doc.internal.pageSize.getWidth();
		const h = doc.internal.pageSize.getHeight();
		doc.text(`RUBBERDUCK.SPACE — ${i} / ${pageCount}`, w / 2, h - 24, {
			align: "center",
		});
	}
}

export async function exportManualPdf(t: TFunction, locale: string) {
	const doc = new jsPDF({ unit: "pt", format: "a4" });
	const hasUnicode = await ensureUnicodeFont(doc);
	const ctx = newCtx(doc, hasUnicode);

	drawHeader(ctx, t("docs.tabs.manual"), t("docs.subtitle"), locale);

	for (let i = 1; i <= 4; i++) {
		setFont(ctx, "bold", 12);
		ctx.doc.setTextColor(30, 30, 34);
		ensureSpace(ctx, LINE_HEIGHT * 2);
		ctx.doc.text(
			`${t("docs.manual.stepLabel", { n: i })} — ${t(`docs.manual.steps.${i}.title`)}`,
			PAGE_MARGIN_X,
			ctx.y,
		);
		ctx.y += LINE_HEIGHT + 2;

		setFont(ctx, "normal", 11);
		ctx.doc.setTextColor(60, 60, 68);
		writeWrapped(ctx, t(`docs.manual.steps.${i}.desc`));

		setFont(ctx, "normal", 10);
		ctx.doc.setTextColor(110, 90, 30);
		writeWrapped(ctx, `★ ${t(`docs.manual.steps.${i}.tip`)}`, { gap: 12 });
		ctx.doc.setTextColor(30, 30, 34);
	}

	drawFooter(doc, hasUnicode);
	doc.save(`rubberduck-manual-${locale.startsWith("sk") ? "sk" : "en"}.pdf`);
}

export async function exportFaqPdf(t: TFunction, locale: string) {
	const doc = new jsPDF({ unit: "pt", format: "a4" });
	const hasUnicode = await ensureUnicodeFont(doc);
	const ctx = newCtx(doc, hasUnicode);

	drawHeader(ctx, t("docs.tabs.faq"), t("docs.subtitle"), locale);

	for (let i = 1; i <= 8; i++) {
		setFont(ctx, "bold", 11);
		ctx.doc.setTextColor(30, 30, 34);
		ensureSpace(ctx, LINE_HEIGHT * 2);
		writeWrapped(ctx, `${i}. ${t(`docs.faq.items.${i}.q`)}`);

		setFont(ctx, "normal", 11);
		ctx.doc.setTextColor(70, 70, 78);
		writeWrapped(ctx, t(`docs.faq.items.${i}.a`), { gap: 10 });
	}

	drawFooter(doc, hasUnicode);
	doc.save(`rubberduck-faq-${locale.startsWith("sk") ? "sk" : "en"}.pdf`);
}
