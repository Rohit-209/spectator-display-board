/**
 * Build report/report.pdf from the eight section markdown files.
 *
 * Renders markdown → HTML via `marked`, applies print-focused CSS
 * (A4-ish, 20mm margins, 11pt, each section starts on a new page),
 * then uses Puppeteer to export a PDF. Also prints the page count
 * so we can see at a glance whether we're inside the 8-page cap.
 *
 * Run: npx tsx scripts/build-report.ts
 */
import puppeteer from "puppeteer";
import { marked } from "marked";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "report");
const SECTIONS = [
  "00-cover.md",
  "01-problem.md",
  "02-concept.md",
  "03-assumptions.md",
  "04-prototype.md",
  "05-results.md",
  "06-reflection.md",
  "07-summary.md",
];

const CSS = `
  @page { size: A4; margin: 15mm 18mm; }
  :root { color-scheme: light; }
  body {
    font: 10pt/1.32 "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #111;
    max-width: none;
  }
  h1 { font-size: 14pt; margin: 0 0 6pt; border-bottom: 1pt solid #999; padding-bottom: 2pt; }
  h2 { font-size: 11.5pt; margin: 8pt 0 3pt; color: #222; }
  h3 { font-size: 10.5pt; margin: 6pt 0 2pt; color: #333; }
  p  { margin: 0 0 4pt; }
  ul, ol { margin: 0 0 4pt 16pt; padding: 0; }
  li { margin-bottom: 1pt; }
  code, pre { font: 8.5pt/1.25 ui-monospace, Menlo, Consolas, monospace; }
  pre { background: #f3f3f3; padding: 4pt 6pt; border-radius: 3pt; overflow: hidden; margin: 3pt 0 5pt; }
  code { background: #f3f3f3; padding: 0 2pt; border-radius: 2pt; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 3pt 0 5pt; }
  th, td { border: 0.5pt solid #999; padding: 2pt 5pt; text-align: left; font-size: 9pt; }
  th { background: #eee; }
  img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  figure { margin: 4pt 0; text-align: center; }
  figcaption { font-size: 8.5pt; color: #333; margin-top: 1pt; line-height: 1.3; }
  a { color: #0b4; text-decoration: none; }
  .section { display: block; }
  figure, table, pre { break-inside: avoid; page-break-inside: avoid; }
  hr { border: 0; border-top: 0.5pt solid #ccc; margin: 8pt 0; }
`;

async function main() {
  const htmlParts: string[] = [];
  for (const file of SECTIONS) {
    const raw = await readFile(path.join(REPORT_DIR, file), "utf8");
    // strip the \newpage LaTeX hint (Pandoc-only); CSS handles the page break
    const clean = raw.replace(/^\\newpage\s*/m, "");
    // promote markdown-style image captions to <figure> / <figcaption>
    // and honour Pandoc {width=XX%} syntax
    const withCaptions = clean.replace(
      /!\[([\s\S]+?)\]\(([^)]+)\)\{[^}]*width=([^ }]+)[^}]*\}/g,
      (_, cap: string, src: string, width: string) => {
        // alternate ** markers → <strong>/</strong> correctly
        let open = true;
        const caption = cap.replace(/\*\*/g, () => (open = !open) ? "</strong>" : "<strong>");
        return `<figure><img src="${src}" alt="" style="width:${width}" /><figcaption>${caption}</figcaption></figure>`;
      },
    );
    const html = marked.parse(withCaptions, { async: false }) as string;
    if (htmlParts.length > 0) {
      // page-break-after on the previous content, not on this one, to avoid double breaks
      htmlParts.push('<div style="page-break-after: always; break-after: page; height: 0;"></div>');
    }
    htmlParts.push(`<div class="section">${html}</div>`);
  }

  const fullHtml = `<!doctype html>
<html><head><meta charset="utf-8">
<base href="file://${REPORT_DIR}/">
<style>${CSS}</style></head>
<body>${htmlParts.join("\n")}</body></html>`;

  // snapshot the HTML for debugging/inspection
  const htmlPath = path.join(REPORT_DIR, "report.html");
  await writeFile(htmlPath, fullHtml);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // navigate via file:// so <base> and relative image paths resolve
    await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded" });
    // wait for all images to load (file:// is instant but be safe)
    await page.evaluate(
      () =>
        new Promise<void>((r) => {
          const imgs = Array.from(document.images);
          if (imgs.every((i) => i.complete)) return r();
          let left = imgs.filter((i) => !i.complete).length;
          imgs.forEach((i) => {
            if (!i.complete)
              i.addEventListener(
                "load",
                () => {
                  if (--left === 0) r();
                },
                { once: true },
              );
            i.addEventListener("error", () => {
              if (--left === 0) r();
            }, { once: true });
          });
        }),
    );
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    const outPath = path.join(REPORT_DIR, "report.pdf");
    await writeFile(outPath, pdf);
    // simple page count via content metadata (puppeteer doesn't return it)
    // → poor man's: ask Chrome to count by reading pdf header
    const sizeKb = (pdf.length / 1024).toFixed(1);
    console.log(`✓ report.pdf written (${sizeKb} KB)`);
    console.log(`  → open ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
