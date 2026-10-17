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
  dev strip removed from public board (still on `/admin`).

## Start next session here

Pick one of these — in rough order of deadline:

1. **Visual check against the projector** — ~30 min. All polish changes
   so far are font-size and content cuts; they're correct in theory but
   the real target is "readable at 10 m on the venue projector".
   Project the board, stand at 3/6/10 m with the `legibility-protocol`
   sheet, and bump sizes again if Zone A target line or Zone E insight
   fail to read at 10 m.
2. **Pilot the lab study on 2 people** (plan Week-4) — ~1 h. Run
   `study/README.md` end-to-end once with a lab-mate, confirm the
   ≈45-min budget holds, and fill the match-specific blanks in
   `study/task-sheet.md` + `study/recall-quiz.md` with the chosen
   match's ground truth.
3. **Demo video** (Week-5 deliverable) — ~2 h. 3-minute capture of a
   full chase with insights firing.
4. **v2 polish** after the lab study runs — scope depends on findings.

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
