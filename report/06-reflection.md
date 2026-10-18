\newpage

# Section 6 — Reflection and Future Scope

## Reflection (≤ 100 words)

The hardest decision was not technical but methodological: committing
to replay mode. A historical feed removed the glamour of "live" but
let every design claim become measurable — identical conditions
across users, latency timestamps on every event, corpus-level tests
against official scorecards. The second lesson was that structural
constraints beat prompt tuning when an LLM touches a public screen:
a fact-pack guard-rail removed hallucinations entirely, while prompt
engineering alone could not. Finally, "glanceable" is harder than
"beautiful"; cutting Zone B of 4s / 6s / extras helped more than any
font change.

## Future scope

- **Live scorer input.** A phone app in which a volunteer taps the
  delivery type each ball would move the system out of replay mode
  without needing a paid data feed.
- **Multi-sport back-end.** The pure-reducer `applyEvent` pattern
  generalises; football possession, badminton rallies and kabaddi
  raids all fit the same event-folding architecture.
- **Outdoor LED hardware test.** Current legibility work targets an
  indoor projector; high-brightness LED video walls change contrast,
  stroke-width and minimum font-size rules.
- **Model-selected narrative.** A small fine-tuned model that ranks
  triggers by current context would replace the fixed trigger
  priority with a learned policy.
- **Audience engagement at scale.** Pair the board with a mobile
  companion personalised to the user's followed players and track
  dwell time, scan rate and panel focus; the engagement-event
  pipeline already written (`/api/engagement`) is wired for this.
- **Spectator-held AR.** Point a phone at the big screen; receive the
  insight ticker in the user's home language.
