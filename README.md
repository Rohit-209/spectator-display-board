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

## Latency measurement

Each ball carries an `emittedAt` timestamp set at the moment the replay
engine emits it. The client records a `renderedAt` on receipt — their
difference is the end-to-end latency surfaced in the board footer and admin
panel, ready for the technical-evaluation table in the plan (target: p95 < 1s).

## Planned next

- Trained logistic-regression win-prob model (Python offline, coefficients
  exported as JSON) replacing the heuristic.
- SQLite persistence of match events + insight audit log.
- Companion page (QR → phone view) with detailed stats and analytics events
  for the engagement study.
- v2 polish after the lab usability study.
