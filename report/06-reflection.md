\newpage

# Section 6 — Reflection and Future Scope

## Reflection (strict ≤ 100 words)

*(Draft; rewrite in your own voice. Current count ≈ 95 words.)*

The hardest decision wasn't technical — it was committing to replay
mode. Choosing a repeatable historical feed removed glamour but let
every design claim become measurable: identical conditions across
participants, latency timestamps on every event, and corpus-level
regression tests against official scorecards. The second lesson was
that structural constraints beat model tuning when AI touches a public
screen: a fact-pack guard-rail removed hallucinations entirely,
whereas prompt-engineering alone could not. Finally, "glanceable"
is harder than "beautiful"; cutting Zone B of its 4s / 6s / extras
numbers improved the board more than any font change.

## Future scope

- **Live scorer input.** A phone-based "one person taps the delivery
  type" entry mode would move the system out of replay-only without
  needing a paid API. Thinnest possible UI, offline-capable.
- **Multi-sport back-end.** The stats engine's `applyEvent` pattern
  generalises; football possession, badminton rallies, and kabaddi
  raids all fit the same reducer-plus-SSE architecture.
- **Outdoor LED hardware test.** The current legibility work targets
  a 1920 × 1080 indoor projector. The design rules change on
  high-brightness outdoor LED panels — different contrast, different
  minimum stroke widths.
- **Personalisation on the companion page.** Follow-your-player,
  betting-market-style markets, and fantasy-league overlays are
  natural extensions once a stable base board is deployed.
- **Automated storytelling model.** A fine-tuned small model that
  decides *which* insight is most interesting given the current
  context, instead of today's rule-based trigger priority.
- **Spectator-held AR.** Point a phone at the big screen; receive the
  insight ticker in your home language.
