# Pilot run — Kolkata Knight Riders v Rajasthan Royals · IPL 2019

Dry-run of the full `study/README.md` session order with one or two
lab-mates before P01 of the real v1 study. Goal: confirm the ≈45-min
budget, verify every cue in `task-sheet.md` lands at a sensible pause
point, and surface anything that needs fixing before the real
participants arrive.

## Why this match

- Chased in **20.2 overs** → last-over finish; win-prob swings cleanly.
- **Multiple wicket clusters** (RR lost 3 in overs 6–8; collapsed to
  122/5 at over 15; came back through Parag) → good Task 5 material.
- **KD Karthik 97** from the losing side → recall-quiz Q3 is a real
  discriminator (participants expect the top scorer to come from the
  winning side).
- **2019** → old enough that participants in 2026 are unlikely to
  remember the result, recent enough that player names feel familiar.
- Regular league game, not a final / qualifier → low "I was there"
  bias.

## Before you start

1. Dev server up: `npm run dev` → board on `http://localhost:3000`,
   admin on `http://localhost:3000/admin`.
2. Confirm match **1178418** appears in the admin match list — the file
   has already been copied into `data/matches/`.
3. Projector plugged in; participant chair placed at **6 m**; floor
   tape at **3 m / 6 m / 10 m** for the legibility test.
4. Print one copy each of:
   - `study/consent-form.md`
   - `study/intake-questionnaire.md`
   - `study/legibility-protocol.md`
   - `study/pilot/task-sheet.md` ← match-specific
   - `study/sus-questionnaire.md`
   - `study/ues-sf-questionnaire.md`
   - `study/pilot/recall-quiz.md` ← match-specific
   - `study/observer-sheet.md`

## Session order (same as `study/README.md`)

1. Consent (1 min)
2. Intake (2 min)
3. Legibility test at 3/6/10 m (5 min)
4. **Replay task block** — load `1178418`, speed `5×`, start.
   Follow the six cues in `study/pilot/task-sheet.md` (20 min)
5. SUS (3 min)
6. UES-SF (3 min)
7. Recall quiz — board off (4 min)
8. Debrief verbatim (2 min)

Total ≈ 40 min + buffer. Stopwatch each stage; if any goes >150 % of
budget flag it in the "pilot findings" section below.

## After the pilot — fill in blanks for v1

The pilot's main job is to lock down the two values I couldn't
precompute without actually running the replay:

- **Recall-quiz Q5 ground truth** — list of insight texts that fired
  during the replay. Pull with:
  ```bash
  curl -s "http://localhost:3000/api/insight-audit?matchId=1178418" \
    | jq '.audits[] | {trigger, text, source}'
  ```
  Paste a handful into the `recall-quiz.md` ground-truth block so the
  real-run facilitator can score Q5 quickly.
- **Recall-quiz Q6 ground truth** — win-prob bucket at the end of
  over 17 of the chase. Load the match, seek to **2.17**, and read
  Zone D at the moment Task 5 would pause.

## Pilot findings — fill as you go

Write one bullet per issue; tag severity `[blocker|major|minor]`;
include the zone or sheet affected. These feed the v1 iteration
backlog *and* the report's "pilot" paragraph.

### Timing

- Legibility test took: _____ min (budget 5)
- Task block took:      _____ min (budget 20)
- SUS + UES + quiz:     _____ min (budget 10)
- Total session:        _____ min (budget 45)

### Material issues

- [ ] Task 1 cue landed where expected? If not, which over?
- [ ] Task 4 "most expensive over" ground truth matched the Manhattan
      panel at the moment of pause?
- [ ] Task 6 — did an insight actually fire within ~1 over of expected?
      If not, consider dropping `AI_GATEWAY_API_KEY` for a session so
      every trigger shows a Template (deterministic text).

### Board issues

- [ ] Any text that was unreadable at 10 m during legibility test?
- [ ] Any panel in Zone C that confused the participant?
- [ ] Any element that drew the eye for the wrong reason (motion,
      colour, flicker)?

### Facilitator pain points

- [ ] Was pausing at the exact cue awkward? Should we switch to
      keyboard shortcut only?
- [ ] Did the stopwatch distract the think-aloud flow?

## Ship-ready checklist for v1

Before P01 of the real study, confirm:

- [ ] Pilot ran end-to-end within 60 min for both pilot subjects.
- [ ] Recall-quiz Q5 insight list has ≥ 3 entries pasted in.
- [ ] Recall-quiz Q6 win-prob bucket is filled.
- [ ] Any `[blocker]` or `[major]` finding from above is either fixed
      or has an open task in `PROGRESS.md`.
