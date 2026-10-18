\newpage

# Section 7 — One-Page Summary

**Problem.** Spectators at live cricket matches see a thin slice of
the rich data that broadcast viewers enjoy. Stadium scoreboards show
runs and overs; broadcasts show win-probability, player comparisons,
and commentary that turns raw numbers into story. We asked whether a
venue-grade display board could narrow this gap by combining
real-time statistics, a trained win-probability model, and
AI-generated narrative insights — safely, repeatably, and
measurably.

**System.** Our board renders five fixed zones on a 1920 × 1080
projector: a score strip, live batter and bowler cards, a rotating
feature panel (worm / Manhattan / phase comparison / top scorers), a
win-probability gauge, and an AI-insight ticker. Because no scorer
feed exists for amateur matches, the system runs in **replay mode**:
a historical IPL match from Cricsheet is streamed event-by-event at
chosen speed, with timestamps on every event so end-to-end latency is
measurable. A QR code on the board links to a phone companion that
carries dense stats off the shared screen.

**Methods.** A pure-reducer stats engine folds every delivery into
match state and is regression-tested by replaying the entire
Cricsheet IPL corpus against official scorecards. A logistic
regression win-probability model is trained in Python and deployed as
JSON coefficients evaluated in Node — no Python at runtime. AI
insights are gated by a *fact-pack-only* prompt and a numeric
validator: the LLM sees only pre-verified numbers, and every number
in its reply is re-checked before it reaches the board, with a
template fallback whenever the LLM is slow, absent, or wrong.

**Results.** The stats engine passes **1,243 / 1,243** IPL matches.
End-to-end latency measured on a representative capture is p50
**6 ms** / p95 **12 ms** — two orders of magnitude under the
plan's ≤ 300 ms target. The win-probability model beats a
required-run-rate baseline on held-out 2025 + 2026 seasons
(**Brier 0.139 vs 0.148**; log loss 0.424 vs 0.453). Every LLM
insight that reaches the screen is numerically correct by
construction.

**Impact.** The architecture turns broadcast-grade overlays into
infrastructure that smaller venues and college tournaments can deploy
without a production truck.

---

**§8 Bonus claims (meaningful AI/ML + coded demo).**
Trained logistic-regression win-prob model (details §4);
LLM in the live loop with fact-pack guard-rail + numeric validator;
public reproducible repo, Apache-licensed:
<https://github.com/Rohit-209/spectator-display-board>.
