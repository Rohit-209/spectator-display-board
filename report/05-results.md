\newpage

# Section 5 — Results and Discussion

*(Target ~700 words. 20 % of the paper's marks. Lead with a results
table and a graph; discussion follows.)*

## 5.1 Summary of results

| Dimension | Target | Achieved | Status |
|-----------|-------:|---------:|-------:|
| Stats correctness | 100 % of 20 matches | **1,243 / 1,243 IPL matches** | ✓ exceeds |
| Median end-to-end latency | ≤ 300 ms | **6 ms** (17-sample capture) | ✓ exceeds |
| p95 end-to-end latency | ≤ 1 s | **12 ms** | ✓ exceeds |
| Win-prob Brier score | Beat RRR baseline | **0.139 vs 0.148** | ✓ |
| Win-prob log loss | Beat RRR baseline | **0.424 vs 0.453** | ✓ |
| LLM insight accuracy | 100 % numerically correct after validator | 100 % by construction (every number re-checked) | ✓ |
| 10 m text readability (Zone A, Zone E) | legible for 10 of 10 participants | pending lab-study pilot | ⏳ |
| SUS score (v1) | ≥ 68 ("above average") | not yet measured | ⏳ |

## 5.2 What worked

- **Pure-reducer stats engine → corpus-level regression tests.**
  Making `applyEvent` free of side-effects let us replay the entire
  Cricsheet IPL corpus against official scorecards. The harness
  caught two subtle bugs (bowlers credited for run-outs; super-overs
  bleeding into innings 2) that no unit test on hand-crafted data
  would have spotted.
- **Coefficient-only ML deployment.** Training in Python, exporting
  only the learned coefficients to JSON, and evaluating the formula
  in Node removed an entire Python server from the runtime stack
  while keeping the model interpretable in the viva.
- **Fact-pack guard-rail on the LLM.** Prompting the LLM only with
  pre-verified numbers, then re-checking every number in its reply
  against that pack, makes hallucinated statistics structurally
  impossible on screen. The template fallback keeps the ticker
  working even when the API is down.
- **Replay engine with seeded timing.** Every participant in a
  usability session sees the identical match at the identical speed,
  so time-to-answer per task is comparable across groups.
- **Companion phone page as a design-density release valve.** Moving
  dense stats (bowler economy, extras breakdown, 4s/6s) to a
  QR-launched mobile page let the projected board hit the "≤ 7
  numbers outside Zone C" rule without losing the detail
  stats-savvy spectators want.

## 5.3 What didn't

- **Lab-study data not yet collected.** The §5.2 usability
  deliverable in the project plan (SUS, UES-SF, legibility, 6 tasks)
  is prepared on paper and the match-specific materials are filled,
  but no participants had been run by the submission deadline. The
  report therefore under-represents one dimension that the
  assignment brief explicitly asks about ("evaluate its usability").
- **p95 latency has a handshake tail.** Server-sent events incur a
  one-time connection cost that dominates the first few samples; the
  rolling-window p95 reported in the admin dashboard excludes the
  first two events for this reason. A truly symmetric result would
  need a WebSocket-based transport.
- **Insight pacing can starve.** The 2-overs-per-insight pacing rule
  means a dull passage (e.g. a long middle-overs partnership with no
  milestone) shows the same insight for too long. A "freshness
  decay" that nudges a lower-rank trigger through would help.
- **Zone-C rotation is on a dumb timer.** Participants in the pilot
  may miss a specific panel if its 12 s slot has just passed; a
  hand-off from the insight engine (e.g. show Manhattan after a big
  over) is a natural v2 fix.

## 5.4 Who this helps

- **Organisers.** A deployable board that needs no scorer feed means
  college tournaments, inter-hostel leagues, and smaller venues can
  show broadcast-grade overlays without a production truck.
- **Spectators.** The whole raison d'être — contextual numbers,
  trends, and insights replace a static scoreboard. The companion
  page gives power-users deeper stats without cluttering the shared
  display.
- **Sport technologists.** The architecture (replay engine →
  pure-reducer stats → coefficient-only ML → validated LLM) is a
  reference pattern for any AI-augmented live sports overlay.

## 5.5 Improvements for a v2

- Run the lab-study pilot (materials and match are ready in
  `study/pilot/`); fold SUS, task time, and legibility results into
  the §5 table.
- Replace SSE with WebSockets to flatten the p95 latency tail.
- Teach the insight engine to steer Zone C's rotation on key events.
- Train and compare a gradient-boosted win-prob model; expose both
  predictions on the admin dashboard for interpretability
  side-by-side.
- Add a live scorer-input mode so one person tapping on a phone can
  drive the same board at any ground, graduating out of replay-only.
