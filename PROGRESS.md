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

## Assignment-2 context (added 2026-10-17)

The actual deliverable is a **12–15 page PDF** on Nalanda (max 8 per the
first paragraph of the brief — confirm with the prof). The engineering
built here is now the §4/§5/§8 evidence base, not the deliverable.
Scaffold lives in `report/`; see `report/README.md` for the section map
and build recipe. Demo video is **deferred** — the +10% bonus can
still be claimed via AI/ML integration alone; add the video later if
time allows.

## Start next session here

Pick one of these — in rough order of deadline (14 days to 31 Oct 2026
if that's the real due date):

1. **Confirm deadline + page cap with the prof/Nalanda** — ~15 min.
   The PDF says "31 Oct 2025" but the semester header says Sem-I
   2026-27; everything else hangs on resolving this.
2. **Write the report** — ~8–10 h total. Fill `report/*.md` in the
   priority order laid out in `report/README.md` (§4 and §5 first,
   then §2/§3, then §1/§6/§7, then §0/§8/references). Compile with
   Pandoc per the recipe in the README, or paste into Word for final
   layout.
3. **Capture report screenshots** — ~30 min. The list is in
   `report/README.md`: full board mid-chase, admin dashboard,
   companion mobile, calibration PNG (already in `model/out/`),
   architecture diagram redrawn in Excalidraw.
4. **Run the pilot lab study** (optional, strengthens §5) — ~1 h,
   needs a lab-mate + projector. Follow `study/pilot/README.md`.
   Also doubles as the projector legibility check.
5. **Demo video** — **deferred**. ~2–3 h when you want it. 3-minute
   capture of a full chase with insights firing; adds depth to the §8
   bonus claim.

## Commands cheat sheet

```bash
npm run dev                  # board + admin at :3000, companion at :3000/m
npm test                     # stats correctness vs 3 bundled matches
npm run test:full            # 20 random matches from model/data/raw
npm run db:ingest            # populate data/board.db from Cricsheet
npm run build                # Next.js build (also typechecks)
cd model && source .venv/bin/activate && python train.py   # retrain win-prob
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
