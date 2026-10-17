# Lab usability study — materials

Paper-and-screen materials for the §5.2 usability study (10–12 participants,
v1 run, then a 6-person v2 retest after fixes). Companion §5.3 engagement
materials live here too so one folder covers all human-subjects work.

## Session order (≈ 45 min per participant)

1. **Welcome & consent** — `consent-form.md` (1 min)
2. **Intake** — `intake-questionnaire.md`: age bracket, cricket knowledge
   self-rating, viewing frequency (2 min)
3. **Legibility test** at 3 m / 6 m / 10 m — `legibility-protocol.md`
   (5 min, done before the replay so participants haven't acclimatised to
   the board)
4. **Replay task block** — load the chosen chase, run at 5× speed. Pause
   at each cue in `task-sheet.md` and record on `observer-sheet.md`
   (20 min)
5. **SUS** — `sus-questionnaire.md`, 10 items (3 min)
6. **UES-SF (adapted)** — `ues-sf-questionnaire.md`, 12 items (3 min)
7. **Recall quiz** — `recall-quiz.md`, 6 items, closed-book (4 min)
8. **Debrief** — one open question: "anything confusing or missing?",
   note verbatim on observer sheet (2 min)

Total ≈ 40 min + buffer.

## Choosing the study match

The task sheet and recall quiz assume a **2nd-innings chase that goes past
the 15th over** so the win-probability model and the insight ticker both
get worked. Pick a match the sample is unlikely to remember — the three
bundled 2026 matches are too recent for a 2026 cohort. From the full
ingested corpus (`npm run db:ingest`), prefer an older IPL season (≤ 2020)
with a competitive finish (margin ≤ 20 runs or ≤ 3 wickets).

Fill the match-dependent blanks in `task-sheet.md` and `recall-quiz.md`
before each session; keep both the blank template and the per-session
filled copy for the appendix.

## Running the replay

```bash
npm run dev            # board on :3000, admin on :3000/admin
# in /admin: pick match → set speed 5× → start
# pause with the spacebar shortcut when the task sheet says to
```

Project the board at 1920×1080 against a plain wall. Measure 3 m, 6 m,
10 m on the floor with masking tape before the first participant arrives.

## Data handling

- Give each participant a code (`P01`, `P02`, …) at consent. Do **not**
  write their name on any other sheet.
- Keep the signed consent form in a separate envelope from the task,
  SUS, UES, and quiz sheets.
- Transcribe scanned sheets into `study/data/v1.csv` (gitignored by
  default — add a `.gitkeep` if you want the folder tracked).
- Delete any video within 7 days of coding, per the plan §5.3 ethics
  note.

## Pilot before the real run

Do one full dry-run with a lab-mate before `P01`. Time each stage; if the
block runs over 50 min, cut UES down to the 6-item "focused attention"
subscale and note the change in the report.
