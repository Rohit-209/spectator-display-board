\newpage

# Section 5 — Results and Discussion

<div class="stat-row">
<div class="stat"><div class="stat-value">1,243 / 1,243</div><div class="stat-label">IPL matches pass the stats-engine correctness harness</div></div>
<div class="stat"><div class="stat-value">6 / 12 ms</div><div class="stat-label">latency p50 / p95 — plan target ≤ 300 ms / 1 s</div></div>
<div class="stat"><div class="stat-value">0.139 Brier</div><div class="stat-label">beats RRR-only baseline (0.148) on held-out 2025–26</div></div>
</div>

## Headline results

| Metric | Plan target | Achieved |
|--------|-------------|----------|
| Stats-engine correctness | 100 % of 20 matches | **1,243 / 1,243** IPL matches |
| End-to-end latency (p50) | ≤ 300 ms | **6 ms** |
| End-to-end latency (p95) | ≤ 1 s | **12 ms** |
| Win-prob Brier score | beat RRR baseline | **0.139** vs 0.148 |
| Win-prob log loss | beat RRR baseline | **0.424** vs 0.453 |
| LLM insight numeric accuracy | 100 % after validator | 100 % by construction |

![**Figure 2** — Win-probability calibration, held-out 2025 + 2026
(16,169 deliveries). Red line is perfect calibration; the model
tracks it tightly across the 0–1
range.](figures/calibration.png){width=35%}

## Discussion

**What worked.** A side-effect-free stats engine made the entire IPL
corpus a regression test and caught two reducer bugs; JSON-coefficient
deployment removed a Python server from the runtime; the fact-pack
guard-rail makes hallucinated numbers structurally impossible.

**What didn't.** Live-screening engagement data remains uncollected
(§5.3 of the plan is out under the 8-page cap). Zone C's dumb 12 s
rotation would benefit from an insight-driven hand-off.

**Who it helps.** Smaller venues and college tournaments can deploy
broadcast-grade overlays with no scorer feed and no paid API; the
phone companion keeps the shared screen glanceable.
