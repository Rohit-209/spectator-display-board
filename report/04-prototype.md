\newpage

# Section 4 — Prototype, Simulation, Analysis and Testing

The board runs locally with three commands —
`npm install && npm run db:ingest && npm run dev` — and is deployed as a
Next.js app on `localhost:3000` with SQLite persistence and a Python
training step kept offline. All testing uses the open Cricsheet IPL
corpus (1,243 matches, 2008–2026) under *replay mode* so every run is
reproducible.

![**Figure 1** — Board mid-chase (RR 98/4, 12.2 ov) during IPL 2019
match 1178418. Five fixed zones: A score strip, B live players,
C rotating feature panel (phase comparison shown), D win-probability
gauge (37 % RR, 63 % KKR), E AI-insight ticker. QR links to the phone
companion.](figures/board-full.png){width=62%}

**Stats correctness.** `applyEvent(state, event)` is pure, so the test
harness (`npm test`, `test/stats-correctness.test.ts`) replays each
Cricsheet IPL match from ball zero and compares final totals to the
official scorecard. **Result: 1,243 / 1,243 matches pass.** The
harness caught two reducer bugs during development — bowlers being
credited for run-outs, and super-overs leaking into innings 2 — that
hand-crafted unit tests had missed.

**End-to-end latency** is measured by stamping every event at emit and
again at render, exposed as a rolling p50/p95 on the admin dashboard.
On a representative capture (match 1178418, 20× speed, 17 samples)
the median is **6 ms** and p95 is **12 ms** — two orders of magnitude
under the plan's ≤ 300 ms median target.

**Insight audit.** Every LLM-generated line is checked by the numeric
validator and logged in SQLite; failures route to a template fallback.
In the capture above the LLM key was absent, so all 7 triggers routed
to templates (wicket × 4, powerplay_end × 1, milestone × 1, over_end
× 1) — the audit panel at `/admin` and the API endpoint
`/api/insight-audit` surface counts, rejection rate, and the raw
JSONL. With the key enabled, every number shown on screen remains
pre-validated.

Full win-prob metrics and the calibration curve appear in §5.
