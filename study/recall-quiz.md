# Recall quiz — 6 items

Participant code: `P___`     Date: ___________
Match: ______________________________________________

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
what was the win probability for the chasing team?

- [ ] under 20 %
- [ ] 20–40 %
- [ ] 40–60 %
- [ ] 60–80 %
- [ ] over 80 %
- [ ] don't remember

---

## Facilitator — ground truth (fill from the match data before the session)

Keep this half of the sheet. Mark each item **correct / partial / incorrect**.

| Q | Ground truth | Marking rule |
|---|--------------|--------------|
| 1 | {{winner}} | exact team |
| 2 | {{margin}} | within ±1 run or exact wicket count |
| 3 | {{top-scorer}} | exact name (surname OK) |
| 4 | {{turning-point-over}} | ±2 overs with a plausible reason, OR win-prob swing ≥ 15 pp over the stated over → correct |
| 5 | any insight that fired during the replay (see insight audit `/api/insight-audit?matchId=…`) | gist of subject + metric + direction |
| 6 | {{bucket at last pause}} | exact bucket, else partial if adjacent |

Score: ____ / 6     Partial credit: ____     Notes:
