\newpage

# Section 8 — Bonus

*(Up to +10 %, capped by the overall-100 % rule. Attach the four
sub-claims below with concrete evidence; the rubric names
"video evidence expected — host and provide a link" explicitly.)*

## 8.1 AI / ML / data-analytics integration

- **Trained ML model.** Logistic-regression win-probability model
  trained on 1,211 Cricsheet IPL matches / 139k 2nd-innings
  deliveries. Held-out seasons 2025 and 2026. Brier 0.139 beats the
  RRR-only baseline at 0.148; calibration plot in `figures/calibration.png`.
  Training code: `model/train.py`; coefficients: `lib/win-prob-coeffs.json`.
- **LLM in the live loop.** Anthropic Claude called through Vercel's
  AI Gateway for narrative insights, gated by a numeric validator so
  every number on screen is pre-verified. Audit log in SQLite
  (`insight_audit` table) exposed at `/api/insight-audit`; rejection
  rate reported on the admin dashboard.
- **Data pipeline.** Full-corpus ingestion script
  (`scripts/ingest.ts`) populates `data/board.db` from the Cricsheet
  raw JSON corpus (1,243 matches → 743 career records + 2,989
  batter-season rows).

## 8.2 Coded demo (video evidence)

- **Hosted demo video (3 minutes):** <HOSTED-URL-HERE>
  Captures a live replay of IPL 2019 KKR v RR (match #1178418), the
  rotating feature panel on Zone C, win-probability movement in
  Zone D, an LLM insight firing in Zone E, and the companion mobile
  view opened via QR. Capture settings: QuickTime 1920 × 1080,
  speed set to 20× for a full chase, trimmed to the dramatic
  passages.

  *Fill the URL above with your YouTube-unlisted or Google-Drive link
  before submitting. Keep both an archival local copy
  (`report/figures/demo.mp4`) and the public link.*

- **Public code repository:**
  <https://github.com/Rohit-209/spectator-display-board>
  Six commits, authored under the student's GitHub identity. README
  explains the launch sequence, test harness, model retrain path,
  and the lab-study materials under `study/`.

## 8.3 Hardware

Not applicable. The project is a software / data-pipeline deliverable;
the plan deliberately scoped out custom hardware so effort could
concentrate on the AI-insight pipeline and the usability study.

## 8.4 Control system

Not applicable in the industrial-control sense. The replay engine's
play / pause / seek / speed interface is a user-facing control panel,
not a closed-loop control system.

---

**Suggested bonus claim (circle the ones you want graded):**
AI/ML ✓ · Coded demo + video ✓ · Hardware — · Control system —
