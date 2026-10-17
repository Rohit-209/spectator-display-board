# Task sheet — pilot run · match 1178418

**Match:** Kolkata Knight Riders v Rajasthan Royals · IPL 2019 · match #43
**Venue:** Eden Gardens · 25 April 2019
**Result:** KKR 175/6 → RR 177/7 (20.2) — RR won by 3 wickets

Participant code: `P___`     Date: ___________     Pilot or v1 real: ___________

**Facilitator reads aloud:** "You'll see a cricket match being replayed
on the big screen at five times normal speed. I'll pause the replay six
times. Each time, I'll ask you one question. Answer out loud — as
quickly as you can, but take as long as you need to be sure. Please
think aloud: tell me what parts of the board you are looking at."

Record **time to first spoken answer** and **correctness**
(correct / partial / wrong) against the ground truth below.

---

## Setup

- `/admin`: load **1178418**, speed **5×**, start.
- Participant seated at **6 m**.
- Spacebar or Pause button on the admin tab to pause exactly on cue.

---

## Task 1 — "Who is winning, and by how much?"

- **Cue:** pause at end of **over 10 of the 2nd innings** (RR chase).
- **Ground-truth state at cue:**
  - RR **78/3** chasing 176 — need **98 off 60** (RRR 9.80, CRR 7.80).
  - KKR are ahead; win-prob roughly 65–75 % for the bowling side (verify
    on Zone D at the moment of pause).
- **Correct answer must contain:** names KKR as ahead **and** quantifies
  the gap — "RR need 98 off 60" or "KKR ~70 % to win" both pass.
  Partial: direction right, gap unquantified.
- Correctness: _____     Time (s): _____     Notes:

## Task 2 — "How many runs does RR need, and how many balls are left?"

- **Cue:** immediately after Task 1 answer; do not advance the replay.
- **Ground truth:** 98 runs off 60 balls (±1 OK, Zone A is the source
  of truth — if the pause landed mid-over, read whatever Zone A shows).
- Correctness: _____     Time (s): _____     Notes:

## Task 3 — "Which of the two batters at the crease is scoring faster?"

- **Cue:** resume, pause **end of over 12**. (Stokes was caught in
  over 11, so a new batter has joined; both at the crease will have
  faced ≥ 5 balls each.)
- **Where to look:** Zone B batter cards — compare the two SR numbers.
- **Correct answer:** names the higher-SR batter; bonus if they state
  both SR values. Confirm against Zone B at the moment of pause.
- Correctness: _____     Time (s): _____     Notes:

## Task 4 — "Which over so far has been the most expensive?"

- **Cue:** wait for Zone C to rotate to **Manhattan — Rajasthan
  Royals**, then pause. (Zone C rotates every 12 s; may take up to
  a full cycle.)
- **Ground truth (chase so far at time of pause, after over 12):**
  - Over 5 = **17 runs** (biggest bar).
  - Over 3 = 13, Over 2 = 12, Over 10 = 11. Any of these as a
    guess for "second biggest" is reasonable.
- **Correct answer:** over 5, ±1 OK. Bonus if they state the runs.
- Correctness: _____     Time (s): _____     Notes:

## Task 5 — "How have RR's chances changed over the last two overs?"

- **Cue:** resume. Pause at **end of over 17** of the chase (RR
  **145/6**; this follows a huge sequence — wicket in 16, then a 15-run
  over 17 by Parag/Archer; large win-prob swing both ways).
- **Where to look:** Zone D win-prob gauge; Zone C worm chart if it's
  on worm when paused.
- **Correct answer:** correct direction ("gone up for RR" by the end
  of over 17) **and** a magnitude or reason (big over, boundaries by
  Parag or Archer, 30 runs off 2 overs). "Dropped then jumped" is also
  a correct description.
- Correctness: _____     Time (s): _____     Notes:

## Task 6 — "In your own words, what does the current AI insight mean?"

- **Cue:** pause the next time Zone E shows a fresh insight. For this
  match, expect insights to fire on:
  - End of KKR powerplay (over 6) — "KKR 32/2 in powerplay"
  - KD Karthik milestone (reaches 25 around over 15–16; 50 around
    over 18–19)
  - KKR big over 11 (25 runs scored off Jaydev Unadkat; win-prob swing)
  - KKR wickets in overs 17 + 18 (Russell, Brathwaite caught)
  - End of RR powerplay (over 6) — "RR 55/1, best start of their chase"
  - RR triple-wicket collapse overs 6–8 (big win-prob drop)
  - R Parag's death-overs onslaught (overs 17–19)
- **Correct answer:** paraphrase that preserves subject (batter /
  bowler / team), metric (runs / overs / probability), and direction.
  Not a word-for-word repeat.
- Insight text verbatim: ___________________________________________
- Source (shown in Zone E corner): [ ] LLM  [ ] Template
- Correctness: _____     Time (s): _____     Notes:

---

## End of task block

- Stop the replay (don't restart — leave it visible for 10 s so the
  participant isn't context-switched abruptly).
- Hand participant: **SUS** → **UES-SF** → **recall quiz** (in that
  order; the quiz is closed-book — rotate the board away or power the
  projector off).
- Debrief: "Was anything on the board confusing or missing?" — note
  the first two sentences verbatim on the observer sheet.
