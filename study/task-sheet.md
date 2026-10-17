# Task sheet — Spectator Display Board

Participant code: `P___`     Match: _______________________     Date: ___________

**Facilitator reads aloud:** "You'll see a cricket match being replayed
on the big screen at five times normal speed. I'll pause the replay six
times. Each time, I'll ask you one question. Answer out loud — as
quickly as you can, but take as long as you need to be sure. Please
think aloud: tell me what parts of the board you are looking at."

Record **time to first spoken answer** (stopwatch starts when the question
finishes, stops when the participant gives their first attempt) and
**correctness** (yes / partial / no) against the ground truth.

---

## Setup

- Board at 1920×1080 on the projector; participant seated at **6 m**.
- Load the chosen match in `/admin`; set speed to **5×**; **start**.
- Scorer-facing laptop open at `/admin` so you can pause at the exact
  cue (spacebar or the Pause button).

For each task, "**Cue**" = the moment at which the facilitator pauses
the replay; "**Expected answer**" = the fact pattern a correct answer
must contain. Fill the per-match blanks from a dry-run before the first
real session.

---

## Task 1 — "Who is winning, and by how much?"

- **Cue:** pause partway through the 2nd innings, roughly **over 10**
  (half-way through the chase).
- **Where to look:** Zone A (score strip + target equation), Zone D
  (win-probability gauge).
- **Expected answer:** names the leading team **and** quantifies the
  gap — e.g. "{{team}} is ahead, they need {{runs}} off {{balls}}" or
  "{{team}} is {{N}}% to win".
- Correctness: _____     Time to answer (s): _____
- Notes:

## Task 2 — "How many runs does the chasing team need, and how many balls are left?"

- **Cue:** immediately after Task 1 answer; do **not** advance the
  replay.
- **Where to look:** Zone A target equation ("Need N off M") and the
  overs counter.
- **Expected answer:** both numbers within ±1 of what Zone A shows.
- Correctness: _____     Time to answer (s): _____
- Notes:

## Task 3 — "Which of the two batters at the crease is scoring faster?"

- **Cue:** resume; pause 2 overs later when both batters have faced at
  least 5 balls each.
- **Where to look:** Zone B (batter cards with Strike Rate).
- **Expected answer:** names the batter with the higher SR and ideally
  cites the SR values.
- Correctness: _____     Time to answer (s): _____
- Notes:

## Task 4 — "Which over so far has been the most expensive?"

- **Cue:** wait for Zone C to rotate to the **Manhattan** panel, then
  pause.
- **Where to look:** Zone C — tallest bar on the Manhattan chart.
- **Expected answer:** over number ±1; bonus if they state the runs
  conceded.
- If Zone C has rotated past Manhattan: wait up to 12 s for it to come
  back around rather than skipping — this measures whether participants
  can wait for a rotating panel.
- Correctness: _____     Time to answer (s): _____
- Notes:

## Task 5 — "How have the chasing team's chances changed over the last two overs?"

- **Cue:** resume; pause after a wicket, boundary, or any ball that
  moves win-prob by **≥ 5 pp** in the current over.
- **Where to look:** Zone D win-probability gauge; Zone C worm chart
  if the panel is on worm.
- **Expected answer:** correct direction ("gone up for the chasers" /
  "dropped") **and** gives a rough magnitude or a reason (wicket,
  boundary, dot-ball sequence).
- Correctness: _____     Time to answer (s): _____
- Notes:

## Task 6 — "In your own words, what does the current AI insight mean?"

- **Cue:** pause the next time **Zone E** displays a fresh insight.
  If none has fired in the last 2 overs, advance up to 1 over at 20×
  until one does, then step back to 5× and pause.
- **Where to look:** Zone E.
- **Expected answer:** a paraphrase that keeps the subject
  (batter / bowler / team), the metric (runs / overs / probability),
  and the direction correct. Not a word-for-word repeat.
- Record: insight text verbatim, LLM or Template (shown in the Zone E
  corner).
- Correctness: _____     Time to answer (s): _____
- Insight text: ___________________________________________________
- Source: [ ] LLM  [ ] Template
- Notes:

---

## End of task block

- Stop the replay.
- Hand participant the **SUS** form, then the **UES-SF**, then the
  **recall quiz** (in that order; the quiz is closed-book — remove the
  board from view).
- Open the debrief: "**Was anything on the board confusing or
  missing?**" — write the first two sentences verbatim on the
  observer sheet.
