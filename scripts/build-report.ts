/**
 * Build report/report.pdf from the eight section markdown files.
 *
 * Renders markdown → HTML via `marked`, applies print-focused CSS
 * (A4, 18mm margins, coloured accents, running header + footer with
 * page numbers), then uses Puppeteer to export a PDF.
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
  :root {
    color-scheme: light;
    --accent: #0f766e;
    --accent-soft: #ecfdf5;
    --accent-ink: #064e3b;
    --ink: #0f172a;
    --ink-mute: #475569;
    --rule: #cbd5e1;
    --panel: #f8fafc;
  }
  @page { size: A4; margin: 20mm 16mm 18mm 16mm; }
  body {
    font: 10pt/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: var(--ink);
    max-width: none;
  }
  h1 {
    font-size: 15pt;
    margin: 0 0 10pt;
    padding: 5pt 10pt;
    background: var(--accent);
    color: white;
    border-radius: 3pt;
    letter-spacing: 0.2pt;
  }
  h2 { font-size: 11.5pt; margin: 10pt 0 3pt; color: var(--accent-ink); font-weight: 700; }
  h3 { font-size: 10.5pt; margin: 6pt 0 2pt; color: var(--ink); font-weight: 600; }
  p  { margin: 0 0 5pt; }
  ul, ol { margin: 0 0 5pt 16pt; padding: 0; }
  li { margin-bottom: 2pt; }
  strong { color: var(--ink); font-weight: 700; }
  code, pre { font: 8.5pt/1.3 ui-monospace, Menlo, Consolas, monospace; }
  pre { background: #0f172a; color: #e2e8f0; padding: 6pt 8pt; border-radius: 3pt; overflow: hidden; margin: 4pt 0 6pt; }
  code { background: var(--accent-soft); color: var(--accent-ink); padding: 0 3pt; border-radius: 2pt; font-size: 8.8pt; }
  pre code { background: none; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 4pt 0 6pt; font-size: 9pt; }
  th, td { border: none; padding: 3pt 7pt; text-align: left; vertical-align: top; }
  th { background: var(--accent); color: white; font-weight: 600; letter-spacing: 0.1pt; }
  tbody tr { border-bottom: 0.4pt solid var(--rule); }
  tbody tr:nth-child(odd) { background: var(--panel); }
  img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  figure { margin: 6pt auto; text-align: center; }
  figcaption { font-size: 8.5pt; color: var(--ink-mute); margin-top: 2pt; line-height: 1.3; font-style: italic; }
  a { color: var(--accent-ink); text-decoration: none; }
  hr { border: 0; border-top: 0.5pt solid var(--rule); margin: 8pt 0; }

  .section { display: block; }
  figure, table, pre, .callout { break-inside: avoid; page-break-inside: avoid; }

  /* ---- callout for key statements ---- */
  .callout {
    background: var(--accent-soft);
    border-left: 3pt solid var(--accent);
    padding: 6pt 10pt;
    margin: 0 0 8pt;
    font-size: 10.5pt;
    line-height: 1.4;
    border-radius: 2pt;
  }

  /* ---- stat cards used on cover and results ---- */
  .stat-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6pt;
    margin: 4pt 0 6pt;
  }
  .stat {
    background: linear-gradient(135deg, #0f766e 0%, #047857 100%);
    color: white;
    padding: 8pt 10pt;
    border-radius: 3pt;
  }
  .stat-value {
    font-size: 15pt;
    font-weight: 800;
    letter-spacing: -0.3pt;
    line-height: 1;
  }
  .stat-label {
    font-size: 7.8pt;
    opacity: 0.92;
    margin-top: 4pt;
    line-height: 1.3;
  }

  /* ---- cover page ---- */
  .cover h1 { display: none; }
  .cover {
    display: flex;
    flex-direction: column;
    gap: 10pt;
  }
  .cover-eyebrow {
    font-size: 9pt;
    letter-spacing: 1pt;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 700;
    margin: 0;
  }
  .cover-title {
    font-size: 38pt;
    font-weight: 900;
    letter-spacing: -0.6pt;
    line-height: 1.02;
    margin: 0;
    color: var(--ink);
  }
  .cover-subtitle {
    font-size: 12pt;
    color: var(--ink-mute);
    line-height: 1.4;
    margin: 0;
    max-width: 165mm;
  }
  .cover-brief {
    background: var(--panel);
    border-left: 3pt solid var(--accent);
    padding: 6pt 10pt;
    font-size: 9.5pt;
    color: var(--ink);
    border-radius: 2pt;
  }
  .cover-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1.3fr;
    gap: 6pt;
  }
  .cover-card {
    border: 0.5pt solid var(--rule);
    border-radius: 3pt;
    padding: 7pt 9pt;
    background: white;
  }
  .cover-card-label {
    font-size: 7.5pt;
    letter-spacing: 1pt;
    text-transform: uppercase;
    color: var(--accent);
    font-weight: 700;
    margin: 0 0 3pt;
  }
  .cover-card-body { font-size: 9.5pt; line-height: 1.4; color: var(--ink); }
  .cover-stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6pt;
    margin: 2pt 0;
  }
  .cover-hero { margin: 2pt auto 0; }
  .cover-hero figcaption { font-size: 8pt; color: var(--ink-mute); }
`;

const HEADER_TEMPLATE = `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 7pt; width: 100%; padding: 6mm 16mm 0; color: #475569; display: flex; justify-content: space-between; letter-spacing: 0.3pt;">
    <span style="text-transform: uppercase;">Spectator Display Board · BITS Pilani · Intro to Sports Engineering · Assignment #2</span>
    <span></span>
  </div>
`;

const FOOTER_TEMPLATE = `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 7pt; width: 100%; padding: 0 16mm 6mm; color: #475569; display: flex; justify-content: space-between;">
    <span>github.com/Rohit-209/spectator-display-board</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
  </div>
`;

async function main() {
  const htmlParts: string[] = [];
  for (const file of SECTIONS) {
    const raw = await readFile(path.join(REPORT_DIR, file), "utf8");
    const clean = raw.replace(/^\\newpage\s*/m, "");
    // promote markdown-style image captions to <figure> / <figcaption>
    // and honour Pandoc {width=XX%} syntax
    const withCaptions = clean.replace(
      /!\[([\s\S]+?)\]\(([^)]+)\)\{[^}]*width=([^ }]+)[^}]*\}/g,
      (_, cap: string, src: string, width: string) => {
        let open = true;
        const caption = cap.replace(/\*\*/g, () => (open = !open) ? "</strong>" : "<strong>");
        return `<figure><img src="${src}" alt="" style="width:${width}" /><figcaption>${caption}</figcaption></figure>`;
      },
    );
    const html = marked.parse(withCaptions, { async: false }) as string;
    if (htmlParts.length > 0) {
      htmlParts.push('<div style="page-break-after: always; break-after: page; height: 0;"></div>');
    }
    // detect the cover file to apply the .cover class to its section wrapper
    const sectionClass = file === "00-cover.md" ? "section cover" : "section";
    htmlParts.push(`<div class="${sectionClass}">${html}</div>`);
  }

  const fullHtml = `<!doctype html>
<html><head><meta charset="utf-8">
<base href="file://${REPORT_DIR}/">
<style>${CSS}</style></head>
<body>${htmlParts.join("\n")}</body></html>`;

  const htmlPath = path.join(REPORT_DIR, "report.html");
  await writeFile(htmlPath, fullHtml);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: "domcontentloaded" });
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
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: "20mm", right: "0mm", bottom: "18mm", left: "0mm" },
    });
    const outPath = path.join(REPORT_DIR, "report.pdf");
    await writeFile(outPath, pdf);
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
