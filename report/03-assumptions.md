\newpage

# Section 3 — Assumptions and Data Source

## Data source

All ball-by-ball match data is drawn from the open **Cricsheet IPL
corpus** [3] — 1,243 matches from 2008 through 2026, consistent JSON
schema, free and attribution-only. One match (IPL 2019 KKR v RR,
#1178418) was selected as the standard replay for all testing and
screenshots: Eden Gardens, 25 Apr 2019, chased in 20.2 overs for a
3-wicket RR win. The match is old enough that recent participants are
unlikely to recall the result and new enough that players feel
familiar.

## Assumptions

| # | Assumption | Value | Source |
|---|------------|------:|--------|
| A1 | Full T20 innings length | 20 overs | ICC rules |
| A2 | Realistic 1× inter-ball interval | ~35 s | Own, from TV |
| A3 | Minimum legible text at 10 m on a 1920 × 1080 projection | ≈ 40 px | ≈ dist/150, own est. |
| A4 | Win-prob train/test split | train ≤ 2024, test 2025 + 2026 | Own; no within-match leak |
| A5 | Latency = server-emit to client-DOM-commit | — | Own instrumentation |
| A6 | LLM safe if every number appears in the fact pack | — | Design, per [2] |

## Scope limits

- **Replay-only**, not a live-API build — repeatable at the cost of
  one-way novelty.
- **Venue projector**, not a mobile-first app — the phone companion
  is a stats sidekick, not a replacement for the shared screen.
- **Lab-scale usability only.** The §5.3 engagement study of the
  original plan (two 15–25 person screenings on a projector) is
  scoped out of this submission under the 8-page cap; materials for
  it live in `study/` of the repo for a future run.

*Bracketed numbers map to the IEEE list in §1.*
