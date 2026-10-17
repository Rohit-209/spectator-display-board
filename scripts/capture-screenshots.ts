/**
 * One-shot report figure capture.
 *
 * Prereq: npm run dev is running on :3000.
 * Run:    npx tsx scripts/capture-screenshots.ts
 *
 * Produces, under report/figures/:
 *   board-full.png       — board at 1920×1080 mid-chase, insight visible
 *   board-worm.png       — board with Zone C on worm chart
 *   board-manhattan.png  — board with Zone C on Manhattan
 *   admin-dashboard.png  — admin page with latency CSV + audit numbers
 *   companion-mobile.png — /m at a phone viewport (iPhone 14 Pro)
 */
import puppeteer, { Browser, Page } from "puppeteer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const MATCH_ID = "1178418";
const OUT = path.join(process.cwd(), "report", "figures");

async function control(action: object) {
  const res = await fetch(`${BASE}/api/control`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(action),
  });
  if (!res.ok) throw new Error(`control ${JSON.stringify(action)} → ${res.status}`);
  return res.json();
}

async function waitFor(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function openBoard(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  // SSE keeps the connection open, so network never idles — wait for Zone A to render
  await page.waitForSelector('[class*="border-accent"]', { timeout: 10_000 });
  await waitFor(2000);
  return page;
}

/** force Zone C onto a specific panel by polling its ARIA label dot colour, waiting up to one full rotation */
async function waitForZoneCPanel(page: Page, want: "worm" | "manhattan" | "phase" | "head") {
  const panelIndex = ["worm", "manhattan", "phase", "head"].indexOf(want);
  // Zone C rotates every 12s; wait until the active indicator dot matches
  for (let i = 0; i < 28; i++) {
    const activeIdx = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('.bg-accent.rounded-full')).filter(
        (d) => d.classList.contains('w-1.5'),
      );
      return dots.length > 0 ? Array.from(document.querySelectorAll('.rounded-full.w-1\\.5')).findIndex((d) => d.classList.contains('bg-accent')) : -1;
    });
    if (activeIdx === panelIndex) return;
    await waitFor(500);
  }
  console.warn(`[warn] gave up waiting for Zone C panel ${want}`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // 1) deterministic reset
  await control({ action: "load", matchId: MATCH_ID });
  await control({ action: "pause" });
  await control({ action: "seekOver", innings: 2, over: 10 });
  await control({ action: "speed", speed: 20 });

  const browser = await puppeteer.launch({ headless: true });
  try {
    // 2) open board + admin BEFORE playing, so they accumulate latency samples
    const admin = await browser.newPage();
    await admin.setViewport({ width: 1600, height: 1800, deviceScaleFactor: 1 });
    await admin.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });

    const board = await openBoard(browser);

    // 3) start the replay now that both pages are listening
    await control({ action: "play" });
    console.log("Replay running at 20× while admin + board collect samples...");
    // 30 s @ 20× ≈ 10 overs of simulated time → ~60 events → plenty of latency samples
    await waitFor(30_000);
    await control({ action: "pause" });
    await waitFor(1000); // let final state settle

    // 4) board — one full shot (current Zone C panel), then wait for each other panel
    await board.screenshot({ path: path.join(OUT, "board-full.png"), fullPage: false });
    console.log("✓ board-full.png");

    await waitForZoneCPanel(board, "worm");
    await board.screenshot({ path: path.join(OUT, "board-worm.png") });
    console.log("✓ board-worm.png");

    await waitForZoneCPanel(board, "manhattan");
    await board.screenshot({ path: path.join(OUT, "board-manhattan.png") });
    console.log("✓ board-manhattan.png");

    await waitForZoneCPanel(board, "phase");
    await board.screenshot({ path: path.join(OUT, "board-phase.png") });
    console.log("✓ board-phase.png");

    // 5) admin — latency samples should be plentiful now
    await admin.bringToFront();
    await waitFor(500);
    await admin.screenshot({ path: path.join(OUT, "admin-dashboard.png"), fullPage: true });
    console.log("✓ admin-dashboard.png");

    // 6) companion mobile — iPhone 14 Pro portrait
    const phone = await browser.newPage();
    await phone.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
    await phone.goto(`${BASE}/m?src=qr`, { waitUntil: "domcontentloaded" });
    await waitFor(2500);
    await phone.screenshot({ path: path.join(OUT, "companion-mobile.png"), fullPage: true });
    console.log("✓ companion-mobile.png");

    // 7) companion batting tab — click by element position (first tab button after the score)
    const tabButtons = await phone.$$("button");
    for (const btn of tabButtons) {
      const text = await btn.evaluate((el) => el.textContent?.trim() ?? "");
      if (text.toLowerCase() === "batting") {
        await btn.click();
        await waitFor(1500);
        await phone.screenshot({ path: path.join(OUT, "companion-batting.png"), fullPage: true });
        console.log("✓ companion-batting.png");
        break;
      }
    }
  } finally {
    await browser.close();
    await control({ action: "pause" });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
