# Recall quiz — pilot run · match 1178418

**Match:** Kolkata Knight Riders v Rajasthan Royals · IPL 2019
Participant code: `P___`     Date: ___________

**Facilitator script:** "This is a short quiz on what happened in the
match you just watched. Please answer from memory — don't look at the
board. If you don't remember, write 'don't remember' rather than
guessing."

Give the participant **4 minutes**; collect the sheet when done.

---

### 1. Who won the match?

Answer: _______________________________________________

### 2. What was the final margin? (runs or wickets, approximate OK)

Answer: _______________________________________________

### 3. Which batter scored the most runs in the match? (either team)

Answer: _______________________________________________

### 4. Which over did you consider the **turning point** of the chase, and why?

Over number: ______    Reason:
_______________________________________________________
_______________________________________________________

### 5. Name one AI-generated insight you remember seeing, in your own words.

_______________________________________________________
_______________________________________________________

### 6. At the moment the replay was paused for the **last task**, roughly
what was the win probability for the chasing team (Rajasthan Royals)?

- [ ] under 20 %
- [ ] 20–40 %
- [ ] 40–60 %
- [ ] 60–80 %
- [ ] over 80 %
- [ ] don't remember

---

## Facilitator — ground truth (keep this half)

Match outcome: **RR won by 3 wickets** chasing 176, scored 177/7 in 20.2
overs — classic last-over finish.

| Q | Ground truth | Marking rule |
|---|--------------|--------------|
| 1 | **Rajasthan Royals** (RR) | exact team |
| 2 | **3 wickets** | "won by 3 wkts" exact; "~2–4 wkts" partial |
| 3 | **KD Karthik — 97** (KKR, from the *losing* team — good discriminator) | surname OK; "Karthik" correct; next closest: R Parag 47, A Rahane 34 |
| 4 | Multiple defensible answers:  **over 11** (Stokes caught, biggest wicket of chase so far), or **overs 6–8** (RR triple-wicket collapse), or **over 17** (Parag's 15-run over flipped momentum back). ±2 overs with a plausible reason → correct. | ±2 overs AND reason references a wicket, boundary surge, or RRR change |
| 5 | Any insight that fired during the replay. After the dry-run, check `curl localhost:3000/api/insight-audit?matchId=1178418` and list the texts here before P01. | gist of subject + metric + direction |
| 6 | **Fill after the dry-run.** Task 5 pauses at end of over 17 with RR 145/6 needing 31 off 18 — win-prob at that moment is in the **40–80 %** range depending on exact ball; verify from `/admin` live state at pause. | exact bucket; adjacent bucket = partial |

Pilot bookkeeping — insight list captured from dry-run:

```
# paste a few insight texts here after the first dry-run so the
# facilitator can score Q5 quickly
```

Score: ____ / 6     Partial credit: ____     Notes:
