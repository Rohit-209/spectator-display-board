# Spectator Display Board

Real-time cricket stats, player comparisons, performance trends and AI-based
insights for spectators — built on a replay engine over
[Cricsheet](https://cricsheet.org) ball-by-ball JSON.

Project plan: see `../Display_Board_Plan.pdf`.

## Run locally

```bash
npm install
npm run dev
```

- Board: <http://localhost:3000>
- Admin controls: <http://localhost:3000/admin>

Pick a match in the admin page, press **Play**, then open the board. Speeds
`1x` / `5x` / `20x` / `50x` are available — at `5x` a full T20 innings fits in
about 15 minutes, matching the planned screening cadence.

Scan the QR code on the main board to open the **companion phone view**
(`/m`) with the detailed scorecard, bowling figures, and all four charts —
instrumented for the engagement study.

## AI insights (optional)

Set `AI_GATEWAY_API_KEY` in `.env.local` to enable live LLM-generated
narrative insights via the Vercel AI Gateway. Without it, every trigger falls
back to a template string, so the board still works offline.

```
# .env.local
AI_GATEWAY_API_KEY=vg_...
```

The pipeline guarantees no hallucinated numbers: every number in the model's
reply is checked against a verified fact pack, and failures are logged and
replaced by the template.

## Architecture (MVP)

```
Cricsheet JSON  →  parse-cricsheet  →  BallEvent[]
                                           │
                                           ▼
                              replay engine (in-memory, timer-based)
                                           │
                                           ▼
                              stats engine (applyEvent reducer)
                                           │
                 ┌─────────────────────────┼─────────────────────────┐
                 ▼                         ▼                         ▼
         win-prob model             insight engine                SSE pub/sub
       (heuristic logreg)       (trigger → fact pack          (/api/stream)
                                  → LLM → validator)                │
                                                                    ▼
                                                        Next.js board UI
                                                        (Zones A–E)
```

### Key files

| Path | Purpose |
| --- | --- |
| `lib/types.ts` | `BallEvent`, `MatchState`, insight message types |
| `lib/parse-cricsheet.ts` | Cricsheet JSON → flattened `BallEvent[]` |
| `lib/stats.ts` | Pure `applyEvent(state, event)` reducer + initial state |
| `lib/replay.ts` | In-memory replay engine (speed, pause, seek, restart) |
| `lib/win-prob.ts` | Heuristic win probability + first-innings projection |
| `lib/insights.ts` | Triggers → fact pack → AI SDK → numeric validator |
| `lib/pubsub.ts` | Server-side subscriber set for the SSE stream |
| `app/api/stream/route.ts` | SSE endpoint pushing state frames to the board |
| `app/api/control/route.ts` | POST actions: load / play / pause / speed / seek |
| `app/api/matches/route.ts` | Lists sample matches in `data/matches` |
| `app/page.tsx` | Board UI (Zones A–E) |
| `app/admin/page.tsx` | Replay controls |

### Board layout (Zones A–E)

- **A — Score strip**: team, score, overs, target equation, CRR/RRR.
- **B — Players**: striker + non-striker cards, bowler figures, partnership, extras.
- **C — Rotating feature panel**: worm chart, Manhattan, phase comparison, top scorers.
- **D — Win probability** (2nd innings) or **Projected score** (1st innings).
- **E — AI insight ticker**: one validated insight at a time.

## Sample data

Three recent IPL matches are included under `data/matches/` so the project
runs standalone. Replace with any Cricsheet IPL JSON file — the parser handles
the standard schema. More files can be dropped in and will appear in the
admin match list.

## Technical results (plan §5.1)

### Stats correctness — 100% match across the full Cricsheet IPL corpus

Replay all 1,243 IPL matches through the parser + `applyEvent` reducer and
assert team totals, extras, each batter card and each bowler card equal the
raw Cricsheet totals computed independently.

```bash
npm test                                # 3 bundled matches, quick
MATCH_SOURCE=model/data/raw \
  MATCH_SAMPLE=5000 npx vitest run      # all 1,243 matches (needs raw dump)
```

### End-to-end latency

Every ball carries `emittedAt` (server) and `renderedAt` (client); their
difference is the end-to-end latency. The admin panel shows live
`p50 / p95 / max` and a **Download CSV** button that exports every sample for
the report (target: p50 < 300 ms, p95 < 1 s).

### Insight audit — rejection rate

Every trigger — wicket, batter milestone, powerplay end, win-prob swing —
appends a row to `data/insight-audit.jsonl` recording the fact pack, the LLM
response (if any), whether the numeric validator passed, and the text that
reached the board. `GET /api/insight-audit` summarises counts and the
LLM rejection rate (validator-failed / LLM-returned). Visible on `/admin`.

## Persistence (SQLite) & player comparisons (plan §2, §3)

A single-file SQLite DB at `data/board.db` holds:

| Table | Purpose |
| --- | --- |
| `matches` | Match metadata (teams, season, venue, winner, total_overs) |
| `batter_season_stats` | Per-batter per-season IPL aggregates (innings, runs, balls, 4s, 6s, highest) |
| `batter_career_stats` | Per-batter career IPL aggregates |
| `insight_audit` | §5.1 insight audit rows (previously JSONL) |
| `engagement_events` | §5.3 engagement events (previously JSONL) |

Populate from the full Cricsheet IPL corpus:

```bash
npm run db:ingest   # 1,243 matches → 743 batter careers / 2,989 batter-seasons
```

The schema is created on first open; `ingest` is idempotent (INSERT OR REPLACE).

`GET /api/compare?batter=NAME&matchId=M` (season inferred from the match) or
`...&season=2025` returns `{seasonStats, careerStats}` with innings, runs,
balls, SR, average, highest. The companion page uses this to show each
batter's current SR against their season and career SR — the "current innings
vs player's season average" row from plan §2, colour-coded against the
baseline.

## Companion phone page & engagement analytics (plan §4, §5.3)

The main board stays glanceable; the detailed stats live at `/m`, accessed
via the QR code on the board. Four tabs — Score, Batting, Bowling, Charts —
subscribe to the same SSE stream as the board.

Every session is instrumented for the engagement study:

| Event | When |
| --- | --- |
| `page_view` | On mount, with `source: "qr"` if the URL carries `?src=qr` |
| `tab_change` | Each tab switch |
| `panel_focus` | A section scrolls into view (IntersectionObserver, 40% threshold) |
| `panel_tap` | Future hook for interactive panels |
| `heartbeat` | Every 10 s while the tab is visible |
| `session_end` | On `pagehide` / `visibilitychange`, with cumulative visible dwell |

Events are appended to `data/engagement.jsonl`. `GET /api/engagement`
returns session counts, QR vs direct split, dwell p50/p95, and panel
focus counts. The admin page shows the summary live and exports the raw
JSONL for the §5.3 Wilcoxon analysis.

## Win-probability model

A logistic regression trained on 1,211 Cricsheet IPL matches (139k 2nd-innings
balls) replaces the heuristic. Features: `runs_needed`, `balls_remaining`,
`wickets_in_hand`, `rrr`, `crr`. Train/test split holds out the two most recent
seasons (2025, 2026).

| Metric (held-out seasons) | Full model | RRR-only baseline |
| --- | --- | --- |
| Brier score | **0.139** | 0.148 |
| Log loss | **0.424** | 0.453 |

See `model/README.md` for retraining. Coefficients are stored in
`lib/win-prob-coeffs.json` and evaluated at runtime in `lib/win-prob.ts` — no
Python server is required to serve the board.

## Planned next

- Lab-study materials: task sheet, SUS, UES-SF, consent form, legibility
  protocol.
- v2 polish after the lab usability study.
- Demo video (Week-5 deliverable).
