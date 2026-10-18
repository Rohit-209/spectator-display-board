\newpage

# Section 1 — Problem Definition

<div class="callout">
<strong>In one sentence.</strong> Build a venue-grade display board
that turns a live cricket feed into glanceable stats, trends,
comparisons, and factually-guarded AI commentary — and show it
works safely, repeatably and measurably.
</div>

## Motivation (~160 words)

Live cricket draws some of the largest sporting audiences in India,
yet the information presented to spectators inside a stadium is still
dominated by low-density LED scoreboards: score, overs, batter runs,
little else. Broadcast viewers see what in-ground viewers do not —
win-probability graphs, player and team comparisons, phase
breakdowns, and commentary that turns raw data into story. The gap
matters: a spectator who understands *why* a passage of play is
significant stays attentive for longer and talks about it more. An
AI-augmented spectator board narrows this gap. By combining a
real-time stats engine, a trained win-probability model, and a
*retrieval-grounded* LLM commentator in which every number the model
can speak has first been verified by the stats engine [2], venues
can deliver broadcast-grade context on the big screen without a
human analyst. This project builds and evaluates such a board for
T20 cricket, using open IPL match data [1] under a replay engine so
every lab participant sees the identical game.

## References (IEEE)

[1] Cricsheet, "Indian Premier League (Men's Twenty20) — ball-by-ball
match data," 2008–2026. [Online]. Available:
<https://cricsheet.org/matches/> (accessed Oct. 2026). *Primary data
source for every match replayed, trained and tested in this project.*

[2] P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal,
H. Küttler, M. Lewis, W. Yih, T. Rocktäschel, S. Riedel, and D. Kiela,
"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,"
in *Advances in Neural Information Processing Systems (NeurIPS)*,
vol. 33, 2020, pp. 9459–9474. *Motivates the fact-pack guard-rail
used in §2: the LLM is grounded on retrieved, pre-verified numbers
and nothing else.*
