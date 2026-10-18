# Build progress — Spectator Display Board

Project plan: `../Display_Board_Plan.pdf`. Code lives in this `board/` dir.

## Done

- **MVP vertical slice** (commit `1376322`) — replay engine, pure `applyEvent`
  reducer, SSE at `/api/stream`, controls at `/api/control`, Zones A–E
  (score / players / rotating charts / win-prob / insight ticker), admin
  page, 3 bundled IPL matches.
- **Trained win-probability model** — Python logreg on 1,211 Cricsheet IPL
  matches / 139k 2nd-innings balls. Held out seasons 2025 + 2026.
  Brier 0.139 vs 0.148 RRR-only baseline; log loss 0.424 vs 0.453.
  Coefficients in `lib/win-prob-coeffs.json`, consumed by `lib/win-prob.ts`
  with no Python at runtime. Retrain: `cd model && python train.py`.
- **§5.1 technical results**:
  - Stats correctness via vitest — **1,243 / 1,243 IPL matches pass**
    (`npm test` for the 3 bundled, `npm run test:full` for 20, raw env var
    for more). Fixed two reducer bugs along the way: bowlers credited for
    run-outs, and super-overs leaking into innings 2.
  - Latency CSV + rolling p50/p95 shown on `/admin`; download button
    exports every sample.
  - Insight audit log in SQLite (`insight_audit` table) + rejection-rate
    endpoint at `/api/insight-audit`, surfaced on `/admin`.
- **Companion phone page** at `/m` with Score / Batting / Bowling / Charts
  tabs. QR on the main board (`components/BoardQR.tsx`) encodes
  `/m?src=qr`.
- **Engagement analytics** (plan §5.3) — `page_view`, `tab_change`,
  `panel_focus` (IntersectionObserver), `heartbeat`, `session_end`
  with cumulative visible dwell. POST `/api/analytics`, GET
  `/api/engagement` summary + `?format=jsonl` export. Admin shows live
  session count, QR vs direct, median + p95 dwell, panel heatmap.
- **SQLite persistence** at `data/board.db`. Tables: `matches`,
  `batter_season_stats`, `batter_career_stats`, `insight_audit`,
  `engagement_events`. `npm run db:ingest` populates matches + batter
  aggregates from the full Cricsheet IPL corpus (1,243 matches →
  743 careers / 2,989 batter-seasons). Idempotent.
- **Batter comparisons** (plan §2 "current innings vs player's season
  average") — `/api/compare?batter=X&matchId=Y` returns season + career
  stats; companion batting tab colour-codes live SR against season and
  career SR.
- **Lab-study materials** (plan §5.2) under `study/` — README +
  facilitator script, consent form, intake questionnaire, task sheet
  (6 tasks with cue points and expected answers), legibility protocol
  (3/6/10 m), 10-item SUS, 12-item adapted UES-SF, 6-question recall
  quiz template, observer sheet. All markdown; print-ready.
- **Board legibility polish v1** (plan §4) — Zone A target line bumped
  to `text-3xl`, RRR to `text-lg` (both for 10 m reading); Zone E
  insight bumped to `text-4xl`. Zone B stripped of 4s/6s/econ/extras
  (companion `/m` page carries the detail) — ~11 numbers now vs ~22
  before; combined with Zone A down to 7, total outside Zone C is ~20.
  Worm chart differentiates innings with solid vs dashed stroke + a
  text legend ("solid"/"dashed") so it reads colour-blind. Ball/latency
  dev strip removed from public board (still on `/admin`). Top-scorers
  panel in Zone C filters out current batters so it no longer duplicates
  Zone B early in each innings.
- **Pilot materials prepared** (plan Week-4) — chose IPL 2019 match
  **1178418** (KKR 175/6 → RR 177/7, chased in 20.2); copied the raw
  JSON into `data/matches/` so admin lists it. `study/pilot/` holds
  a filled task-sheet with pause cues locked to specific overs
  (10, 12, 17), a filled recall-quiz with ground-truth answers for
  Q1–Q4, and a run-sheet README that lists the two blanks (Q5 insight
  list, Q6 win-prob bucket) that must be filled during the dry-run.
- **Report figures auto-captured** —
  `scripts/capture-screenshots.ts` runs a headless Chromium against a
  live dev server, loads match 1178418, seeks to over 10 of the chase,
  plays at 20× with admin + board + mobile tabs open to accumulate
  real latency samples, then pauses and screenshots. Produces 7 PNGs
  into `report/figures/`:
  - `board-full.png` — Zones A–E mid-chase (RR 98/4, 37 % win-prob,
    template wicket insight)
  - `board-worm.png` / `board-manhattan.png` / `board-phase.png` —
    three Zone C rotations of the same pause
  - `admin-dashboard.png` — centre-cropped (1600×1340) to show live
    state, latency p50 6 ms / p95 12 ms over 17 samples, insight
    audit 7 triggers → 7 template fallbacks (no LLM key during
    capture), engagement counters
  - `companion-mobile.png` / `companion-batting.png` — `/m` at
    iPhone 14 Pro viewport
  - `calibration.png` — copied from `model/out/`
- **Report PDF built at 8-page cap** — `scripts/build-report.ts`
  renders the 8 markdown sections via `marked`, honours Pandoc
  `{width=XX%}` on figures, inserts explicit page-break-after
  spacers between sections (Chrome's `break-before: page` was being
  silently ignored mid-document), and prints a 1920×2715 pt A4 PDF
  via headless Chromium. Result: `report/report.pdf`
  (**8 pages, 480 KB, one section per page**). Build takes ~3 s; no
  Pandoc or LaTeX install required.
- **Report visual redesign** (commit `4180b31`) — teal accent system,
  running header + footer on every page (project title at top,
  `github.com/Rohit-209/...` + "Page X of 8" at bottom). New CSS
  primitives `.callout` (teal accent-left box) and `.stat-row`
  (3-column gradient stat cards). Cover was 15 % full → now a proper
  front page: 38 pt title, subtitle, brief-callout, Team/Focus/
  Submission grid, three stat cards (correctness / latency / Brier),
  hero board screenshot. §1 adds a problem-statement callout; §5
  and §7 add stat-rows above their tables; §4 Figure 1 enlarged to
  96 % so the board dominates the page. H1s render as filled teal
  bands; tables get green headers with zebra striping; code blocks
  dark-on-light. §1 references filled with real papers:
  **[1] Cricsheet** (web) + **[2] Lewis et al., "Retrieval-Augmented
  Generation…", NeurIPS 2020**.
- **GitHub repo live and public** —
  <https://github.com/Rohit-209/spectator-display-board>. All six
  commits authored under `Rohit-209 <rohitraj251204@gmail.com>` after
  a one-time `git filter-branch` to fix the earlier
  Rohits-MacBook-Air.local author line.

## Assignment-2 context

- **Deadline: 31 October 2026** (confirmed).
- **Hard 8-page cap, one page per section** — the brief's
  "12-15 pages / 3500 words" line was overridden by the first-paragraph
  cap + the per-section-new-page rule. Current PDF hits exactly 8.
- Demo video is **deferred** — §8 bonus still claims +10 % via trained
  ML model + validated-LLM pipeline + public reproducible repo.
- Vercel deployment is **not planned** — SQLite + in-memory replay
  state + SSE timeout make it a bad fit. If a live demo URL is wanted
  later, Railway / Fly.io / Render are the realistic hosts; a
  `cloudflared tunnel` from a laptop is the quickest "show someone
  once" path.
- §8 bonus and references were folded into §7 and §1 respectively to
  fit the 8-page cap. `report/08-bonus.md` and `report/references.md`
  were deleted; `report/README.md` records this.

## Start next session here

The PDF is submission-ready **except for a handful of named blanks**
on the cover. Impact order for the Oct-31 Nalanda upload:

1. **Fill the cover blanks** — ~5 min, must-do:
   - `report/00-cover.md`: `[Student 1 Name]` / `[ID 1]` /
     `[Student 2 Name]` / `[ID 2]` / `[ID1]_[ID2]_SE_Assignment2.pdf`
   - rebuild with `npx tsx scripts/build-report.ts`
2. **Verify the two IEEE refs are real papers** — both are *correctly
   cited*, but spot-check the Lewis et al. 2020 RAG paper is still
   the version you want to cite. ~5 min.
3. **(Optional) Draw the §2 architecture diagram** —
   `report/02-concept.md` currently uses an inline prose description
   plus an ASCII block in §2 body. A proper drawn
   `figures/architecture.png` would score better in §2; ~20 min in
   Excalidraw.
4. **(Optional, bonus-strengthening)** Set `AI_GATEWAY_API_KEY` in
   `.env.local` and re-run `npx tsx scripts/capture-screenshots.ts`
   so the admin crop shows real LLM vs template vs rejection stats
   instead of 7/7 template fallback. Hero board shot would then
   display an LLM-sourced insight instead of a template.
5. **(Optional, viva-strengthening)** Pilot the lab study
   (`study/pilot/README.md`) — ~1 h with a lab-mate. Gives real SUS /
   UES numbers to cite in the viva even though they won't fit on §5.
6. **Deferred / out of scope for Oct-31**: 3-minute demo video,
   Vercel/Railway live URL.

### Submission checklist

- [ ] Cover: student names, IDs, filename replaced
- [ ] `npx tsx scripts/build-report.ts` → `report/report.pdf` fresh
- [ ] Rename PDF to `<ID1>_<ID2>_SE_Assignment2.pdf`
- [ ] Upload on Nalanda before 31 Oct 2026 23:59 IST

## Commands cheat sheet

```bash
npm run dev                  # board + admin at :3000, companion at :3000/m
npm test                     # stats correctness vs 3 bundled matches
npm run test:full            # 20 random matches from model/data/raw
npm run db:ingest            # populate data/board.db from Cricsheet
npm run build                # Next.js build (also typechecks)
cd model && source .venv/bin/activate && python train.py   # retrain win-prob

# report workflow
npx tsx scripts/capture-screenshots.ts   # with dev server running, ~45 s
npx tsx scripts/build-report.ts          # markdown → report/report.pdf, ~3 s
open report/report.pdf                   # macOS Preview
```

## Gotchas

- `data/board.db`, `data/*.jsonl`, `model/.venv`, `model/data/raw` are all
  gitignored — a fresh clone needs `npm install`, `npm run db:ingest`
  (after fetching Cricsheet raw files), and the model venv rebuilt before
  retraining.
- `AI_GATEWAY_API_KEY` in `.env.local` turns on live LLM insights; without
  it, every trigger uses the template fallback (the audit still records
  it correctly with `source: "template"`).
- `AGENTS.md` is auto-regenerated by `next dev`; don't fight it in diffs.
- Super-over innings are deliberately dropped from `parse-cricsheet.ts`
  (board only renders innings 1 and 2) — don't "fix" this.
