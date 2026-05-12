/**
 * Client-side file parsers for PDF, Word (.docx), and Excel/CSV files.
 * PDF:   pdfjs-dist browser build + CDN worker.
 * DOCX:  mammoth — converts Word documents to HTML + plain text.
 * Excel/CSV: SheetJS (xlsx) — runs entirely in-browser.
 */

const PDFJS_VERSION = "3.11.174";

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");

  GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ")
      .trim();
    if (pageText) pages.push(`[Page ${i}]\n${pageText}`);
  }

  return pages.join("\n\n");
}

// ─── Word (.docx) ─────────────────────────────────────────────────────────────

export interface DocxContent {
  text: string;
  html: string;
}

export async function extractDocxContent(file: File): Promise<DocxContent> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  return {
    html: htmlResult.value,
    text: textResult.value,
  };
}

// ─── Excel / CSV ─────────────────────────────────────────────────────────────

export async function extractSheetText(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sheets: string[] = [];
  for (const name of workbook.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
    if (csv.trim()) sheets.push(`[Sheet: ${name}]\n${csv}`);
  }

  return sheets.join("\n\n");
}
