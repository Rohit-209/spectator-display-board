\newpage

# Section 3 — Assumptions and Data Source

*(Target ~250 words. The rubric expects every borrowed value to have an
IEEE citation — mark each row below as *literature*, *public database*,
*manufacturer* or *own estimate*.)*

## 3.1 Data source

- **Ball-by-ball match data:** Cricsheet IPL corpus, 1,243 matches
  from 2008 through 2026. Free, open, consistent JSON schema.
  *Public database — [Ref 3].*
- **Match used for the usability study:** IPL 2019 KKR v RR
  (match #1178418), Eden Gardens, 25 Apr 2019 — chased in 20.2 overs,
  a 3-wicket win for RR. Chosen for a close chase, a losing-side
  top scorer, and a season recent enough to feel familiar but far
  enough from 2026 that participants are unlikely to remember the
  result.

## 3.2 Assumptions

| # | Assumption | Value | Source |
|---|------------|------:|--------|
| A1 | Full T20 innings length | 20 overs | ICC playing conditions |
| A2 | Realistic average inter-ball interval at 1× speed | ~35 s | Own estimate from TV broadcasts |
| A3 | Minimum legible text height for a projected 1920×1080 board at 10 m | ≈ 40 px | Industry rule-of-thumb (letter height ≈ 1/150 of viewing distance), own estimate for projector pixel density |
| A4 | Season split for the win-probability model | Train ≤ 2024, test 2025 + 2026 | Own choice; avoids within-match leakage |
| A5 | Latency measurement equates "render time" with the time the board commits a new state to the DOM | — | Own estimate; a true photon-to-eye measure would need external instrumentation |
| A6 | LLM insights are safe to show if every number appears in the fact pack | — | Design choice informed by hallucination-mitigation literature [Ref 2] |
| A7 | "Spectator engagement" in a lab setting approximates (but under-samples) real-ground engagement | — | Design limitation; stated openly in §5 |

## 3.3 Scope limits

- **Not** a live-API build. Everything is replay-mode so every
  participant sees the identical match. Path to a live feed is
  discussed in §6.
- **Not** a mobile-first spectator app — the board is designed for a
  venue projector / jumbotron. A phone companion exists for detailed
  stats on demand.
- **Not** evaluated with a stadium crowd. §5 presents only the lab
  usability study; the on-field engagement study is scoped as future
  work.

*(All numeric references in square brackets map to `references.md`.)*
