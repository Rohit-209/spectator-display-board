\newpage

# Section 2 — Concept, Design and Methodology

*(Target ~700 words. Keep every subsection short; most marks here are
for the diagram + pseudo-code, not prose.)*

## 2.1 Core idea

The board is a glanceable, projector-sized display that converts a
ball-by-ball cricket feed into five dedicated zones:

- **A — Score strip** (team, runs/wickets, overs, target equation)
- **B — Live players** (batter cards, bowler figures, partnership)
- **C — Rotating feature panel** (worm chart, Manhattan, phase
  comparison, top-scorers)
- **D — Win probability** (bar gauge, 2nd innings only)
- **E — AI insight ticker** (one sentence at a time)

Because no live scorer feed was available, the system runs in **replay
mode**: a historical IPL match from the open Cricsheet corpus is
streamed event-by-event under speed control, with real emit/render
timestamps so latency is measurable end-to-end.

## 2.2 Architecture

```
+--------------+   events   +---------+   state   +----------+
| Cricsheet    |----------->| Replay  |---------->| Stats    |
| JSON corpus  |            | engine  |           | engine   |
+--------------+            +---------+           +----+-----+
                               |                       |
                               v                       v
                        +---------------+     +----------------+
                        | Win-prob      |<----| SSE hub        |
                        | (logreg, JSON |     | /api/stream    |
                        |  coefficients)|     +----+-----+-----+
                        +-------+-------+          |     |
                                |                  v     v
                                v           +-------+   +--------+
                        +---------------+   | Board |   | Phone  |
                        | Insight engine|   | /     |   | /m     |
                        | triggers →    |---+-------+   +--------+
                        | fact pack →   |
                        | LLM → check   |      +--------------+
                        +---------------+----->| SQLite audit |
                                               | + engagement |
                                               +--------------+
```

*(Redraw this cleanly in Excalidraw / Figma; export to
`figures/architecture.png` and reference it here.)*

## 2.3 Replay engine

A pure Node loop iterates over the match's normalised deliveries and
emits one `BallEvent` per tick at the user-selected speed (1×, 5×,
20×, 50×). Each event carries `emittedAt` for later latency math.
Pseudo-code:

```
load match     ← parse Cricsheet JSON into (meta, events[])
cursor ← 0; interval ← 35000 / speed_ms
every interval:
    if paused OR cursor == events.length: skip
    event ← events[cursor]
    event.emittedAt ← now()
    broadcast(event)       # SSE push to all boards
    cursor ← cursor + 1
```

## 2.4 Stats engine

A pure function `applyEvent(state, event) → newState` folds every
delivery into the match state (score, wickets, batter cards, bowler
figures, partnership, extras, worm points, Manhattan bars). Being
pure makes the engine testable against Cricsheet's official
scorecards — see §4.

## 2.5 Win-probability model

- **Data:** 1,211 IPL 2nd innings from Cricsheet (139k deliveries);
  held out seasons 2025 and 2026 for test.
- **Features:** runs needed, balls remaining, wickets in hand,
  required run rate, current run rate.
- **Model:** logistic regression trained in Python; coefficients
  exported to JSON and evaluated in Node at runtime — no Python
  server needed.
- **Calibration:** see `figures/calibration.png`.

## 2.6 Narrative insight engine (LLM)

The design makes a hallucinated statistic structurally impossible:

1. **Triggers:** wicket, 25/50/100 batter milestone, end of over,
   end of powerplay, partnership milestone, win-prob swing ≥ 15 pp
   within an over.
2. **Fact pack:** on trigger, the stats engine builds a small JSON
   object of verified numbers. **The LLM only ever sees the fact
   pack — never raw deliveries.**
3. **Prompt constraints:** one sentence, ≤ 18 words, must only use
   numbers present in the fact pack; return JSON with text + fact
   keys used.
4. **Validator:** every number in the LLM output is re-checked
   against the fact pack. Failures drop to a deterministic template
   fallback and are logged in SQLite.
5. **Pacing:** at most one insight per two overs, except wickets.

## 2.7 Tools used

- **Frontend / board:** Next.js 16 + Tailwind, TypeScript, React
- **Backend:** Next.js Route Handlers (Node), Server-Sent Events for
  push, SQLite (`better-sqlite3`) for persistence
- **ML:** Python 3.11, scikit-learn, pandas (training only)
- **LLM:** Claude (via Vercel AI Gateway); template fallback for
  offline runs
- **Tests:** Vitest for the stats engine; a bulk-replay harness
  checks totals against Cricsheet scorecards

Full source: <https://github.com/Rohit-209/spectator-display-board>.
