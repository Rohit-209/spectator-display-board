\newpage

# Section 7 — One-Page Summary

*(Strict one page. Draft ~430 words — rewrite the key claims in your
own voice before submitting. Also eligible for publication in SEA's
SportE newsletter per the brief.)*

## Spectator Display Board for T20 Cricket — a one-page summary

**Problem.** Spectators at live cricket matches see a thin slice of the
rich data that broadcast viewers enjoy. Scoreboards show runs and
overs; broadcasts show win-probability, player comparisons, and
contextual commentary that turns raw numbers into story. We asked
whether a venue-grade display board could narrow this gap by combining
real-time statistics, a trained win-probability model, and
AI-generated narrative insights — safely, repeatably, and
measurably.

**System.** Our board renders five fixed zones on a 1920 × 1080
projector: a score strip, live batter and bowler cards, a rotating
feature panel (worm chart / Manhattan / phase comparison / top
scorers), a two-bar win-probability gauge, and an AI insight ticker.
Because no scorer feed exists for amateur matches, the system runs
in **replay mode**: a historical IPL match from Cricsheet is streamed
event-by-event at user-chosen speed, with timestamps on every event
so end-to-end latency is measurable. A QR code links to a phone
companion page that carries dense stats off the shared screen.

**Methods.** A pure-reducer stats engine folds every delivery into
match state; because it has no side effects, we regression-test it
by replaying the entire Cricsheet IPL corpus and comparing final
totals to the official scorecards. A logistic-regression
win-probability model is trained in Python and deployed as JSON
coefficients evaluated in Node — no Python at runtime. AI insights
are gated by a *fact-pack-only* prompt and a numeric validator: the
LLM sees only pre-verified numbers, and every number in its reply is
re-checked before it reaches the board.

**Results.** The stats engine passes **1,243 of 1,243 IPL matches**.
Median end-to-end latency is **9 ms** (target ≤ 300 ms); p95 is
~1.5 s, dominated by first-connection handshake. The win-probability
model beats a required-run-rate baseline on held-out seasons
(**Brier 0.139 vs 0.148**; log loss 0.424 vs 0.453). Every LLM
insight that reaches the screen is numerically correct by construction;
template fallbacks keep the ticker alive when the model API is slow
or unavailable.

**Impact.** The architecture turns broadcast-grade overlays into
infrastructure that smaller venues can deploy without a production
truck. Code and demo video: <https://github.com/Rohit-209/spectator-display-board>.
