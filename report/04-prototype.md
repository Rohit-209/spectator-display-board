\newpage

# Section 4 — Prototype, Simulation, Analysis and Testing

*(Target ~900 words. 30 % of the paper's marks. Screenshots and
graphs are mandatory — every number quoted here should also appear
as a figure or table.)*

## 4.1 Experimental setup

- **Hardware:** Apple M-series laptop; 1920 × 1080 display or
  projector throw (both tested).
- **Software:** Next.js dev server on `localhost:3000`; Node 20; SQLite
  file at `data/board.db`; Python 3.11 for training only.
- **Data:** 1,243 Cricsheet IPL matches (2008 – 2026) ingested into
  SQLite; three bundled matches available for the demo without any
  external file dependency.

Launch sequence:

```bash
npm install
npm run db:ingest        # one-time, populates data/board.db
npm run dev              # board on :3000, admin on :3000/admin
```

## 4.2 Prototype screenshots

Insert each figure, caption it, and reference it in the prose:

- **Figure 1 — Full board, 2nd innings, chase mid-way**
  (`figures/board-full.png`). The five fixed zones: A score strip,
  B live players, C rotating feature panel, D win-probability, E AI
  insight ticker. QR code bottom-right links to the phone companion.

- **Figure 2 — Admin control panel** (`figures/admin-dashboard.png`).
  Replay engine controls (speed, pause, seek), live state readout,
  rolling latency p50/p95, insight audit stats, engagement summary.

- **Figure 3 — Companion mobile view** (`figures/companion-mobile.png`).
  Score / Batting / Bowling / Charts tabs on `/m`; opened by scanning
  the board's QR.

- **Figure 4 — Win-probability calibration curve**
  (`figures/calibration.png`, copied from `../model/out/calibration.png`).
  Held-out IPL 2025 + 2026; near-diagonal fit across the 0–1 range.

## 4.3 Testing — stats correctness

The stats engine's `applyEvent` is pure, so every match in the
Cricsheet corpus can be replayed as a regression test. The harness
(`test/stats-correctness.test.ts`, run with `npm test`) replays each
match from ball zero and asserts that the final per-team runs and
wickets match the official Cricsheet scorecard.

**Result: 1,243 / 1,243 IPL matches pass.** Two reducer bugs were
caught by this harness during development: bowlers were incorrectly
credited for run-outs, and super-over innings leaked into the second
innings' state. Both were fixed before any usability work began.

## 4.4 Testing — end-to-end latency

Every emitted event carries `emittedAt`; the board records the
browser-side `renderedAt` on first commit and the admin dashboard
exposes the rolling distribution. Latency samples are also exported
to CSV from the admin dashboard for the appendix.

**Measurement from the capture used for Figure 2 (match #1178418,
20× speed, replay from over 10.0 of the chase):**

| Metric | Value | Target |
|-------:|------:|------:|
| Latency samples | 17 | — |
| Median (p50) | **6 ms** | ≤ 300 ms |
| p95 | **12 ms** | ≤ 1 s |
| Max | 12 ms | — |

All measurements comfortably beat the plan's targets. Readings
exclude the first-connect handshake, which lands outside the sampling
window the admin dashboard uses.

## 4.5 Testing — win-probability model

Trained on the Cricsheet IPL corpus with a season-based train / test
split (train ≤ 2024; test seasons 2025 + 2026). Comparison to a
required-run-rate-only baseline:

| Metric | Our logreg | RRR-only baseline |
|-------:|-----------:|------------------:|
| Brier score | **0.139** | 0.148 |
| Log loss | **0.424** | 0.453 |
| Train rows | 123,302 | — |
| Test rows | 16,169 | — |

Full model artefacts in `model/out/metrics.json`; calibration plot
in `figures/calibration.png`.

## 4.6 Testing — insight auditing

Every LLM-generated insight is audited by the numeric validator and
written to `insight_audit` in SQLite. `/api/insight-audit` exposes
counts per source (`llm` vs `template`) and the rejection rate — the
fraction of LLM outputs that failed validation and were replaced by a
template.

**Figures from the capture used for Figure 2** (match #1178418,
chase from over 10.0, ~10 overs of simulated time):

| Measure | Value |
|-------:|------:|
| Triggers fired | 7 |
| By trigger type | wicket × 4, powerplay_end × 1, milestone × 1, over_end × 1 |
| LLM-attempted | 0 |
| Template-fallback used | 7 |
| LLM validator rejection rate | — (no LLM calls in this capture) |

The LLM path was deliberately disabled for this capture (no
`AI_GATEWAY_API_KEY`), so every trigger routed to the deterministic
template. A capture with the key enabled would populate the "LLM
attempted / returned / validator passed / rejection rate" cells; the
plumbing is in place and the audit log is written whether or not the
LLM is reached.

Live numbers at any time with:

```bash
curl -s "http://localhost:3000/api/insight-audit" | jq '.summary'
```

## 4.7 Design-rule testing — board legibility

- Minimum text height for Zone A (target equation) and Zone E
  (insight sentence) was audited against a 10 m viewing distance
  on a 1920 × 1080 projection. Fonts were sized `text-3xl` /
  `text-4xl` respectively (≈ 30 / 36 px) so the characters subtend
  the industry-recommended ≥ 40 px at that distance.
- Colour-blind safety: team labels accompany every colour swatch;
  the worm chart uses a solid-vs-dashed stroke so the two innings
  are distinguishable without colour.
- Density: Zone A was tuned down to 7 displayed numbers to match the
  design-rule target; secondary numbers were pushed to the phone
  companion page.

A full 3 m / 6 m / 10 m legibility sheet is included in the
usability-study materials (`study/legibility-protocol.md`).
