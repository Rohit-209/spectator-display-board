\newpage

# Section 2 — Concept, Design and Methodology

The board is a 1920 × 1080 projected display with five fixed zones:
**(A)** score strip, **(B)** live batter and bowler cards,
**(C)** a rotating feature panel (worm, Manhattan, phase comparison,
top scorers), **(D)** win-probability gauge, **(E)** AI-insight ticker.
Because no live scorer feed exists for amateur matches, the system
runs in **replay mode** — a historical IPL match from the open
Cricsheet corpus is streamed event-by-event under speed control, with
timestamps on every event so end-to-end latency is measurable.

**Architecture.** Cricsheet JSON → *replay engine* (speed-controlled
tick) → *stats engine* (pure `applyEvent` reducer) → **Server-Sent
Events hub** → *board* + *phone companion*. In parallel the stats
engine feeds a *win-probability model* (logistic regression, JSON
coefficients) and an *insight engine* (triggers → fact pack → LLM →
validator → template fallback). SQLite persists match aggregates,
insight audit, and engagement events.

**Replay engine.** A deterministic loop emits one `BallEvent` per tick
at user-selected speed (1× / 5× / 20× / 50×). Each event carries
`emittedAt`; the admin panel exposes play, pause, seek, and restart.

```
load match     ← parse Cricsheet JSON into (meta, events[])
cursor ← 0; tick ← 35000ms / speed
every tick:
    if paused: skip
    event ← events[cursor]; event.emittedAt ← now()
    SSE.broadcast(event)
    cursor ← cursor + 1
```

**Stats engine.** A pure function `applyEvent(state, event) → newState`
folds each delivery into score, wickets, batter cards, bowler
figures, partnership, worm points and Manhattan bars. Being pure, it
is regression-tested against the entire Cricsheet IPL corpus (§4).

**Win-probability model.** Logistic regression on 2nd-innings features
(runs needed, balls remaining, wickets in hand, CRR, RRR), trained in
Python on 1,211 IPL matches / 123k rows (train seasons ≤ 2024,
test 2025–2026). Coefficients exported to JSON and evaluated in Node
at runtime — no Python server.

**Narrative insight engine.** Rule-based *triggers* (wicket,
25/50/100 milestone, powerplay/over end, partnership milestone,
win-prob swing ≥ 15 pp) build a small *fact pack* of verified
numbers. The LLM sees **only the fact pack** and must reply with one
sentence (≤ 18 words) using only numbers from that pack. A validator
re-checks every number before display; failures route to a template
fallback and are logged in SQLite. Pacing: ≤ 1 insight per 2 overs,
except for wickets.

**Stack:** Next.js 16 + Tailwind + TypeScript on the front; Node 20
Route Handlers with Server-Sent Events + `better-sqlite3`; Python
3.11 + scikit-learn for training; Anthropic Claude via Vercel AI
Gateway with a deterministic template fallback. Full source:
<https://github.com/Rohit-209/spectator-display-board>.
