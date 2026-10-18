# Assignment-2 report scaffold

PDF deliverable for BITS Pilani · Intro to Sports Engineering · Sem-I
2026-27, Assignment #2 (Idea #15 — spectator display board).

**Hard constraints from the brief (confirmed with the student 2026-10-17):**

- One PDF, submitted on Nalanda, filename contains both student IDs.
- **Deadline: 31 October 2026** (14 days from 17 Oct).
- **Hard cap: 8 pages.** Combined with "each section starts on a new
  page", this is effectively **one page per section** — §0, §1, §2,
  §3, §4, §5, §6, §7 each get exactly one page. §8 (bonus) and
  references must live inline on another section's page or be
  skipped (recommended: fold §8 claims into §4/§5 captions and the
  one-page summary, keep references on §7's spare space).
- Each section starts on a new page; section title in the page header.
- Word envelope dropped from ~3500 to **~2000** total (one-page
  sections, 11pt, 20mm margins, factoring in figure space).

## Section map — one page each (8-page cap)

| File | Section | Weight | Page budget | What has to fit |
|------|---------|-------:|------------:|------------------|
| `00-cover.md` | Cover page | 5% | 1 page, mostly whitespace | title, names, IDs, focus |
| `01-problem.md` | Problem definition | 10% | 1 page | ≤150-word motivation + 2 IEEE refs |
| `02-concept.md` | Concept / methodology | 20% | 1 page | **block diagram (half page)** + ~250 words + 1 pseudo-code block |
| `03-assumptions.md` | Assumptions + data source | — | 1 page | 6-row assumptions table + 100-word data-source note |
| `04-prototype.md` | Prototype / testing | **30%** | 1 page | **2 figures** (Figure 1 board, Figure 2 admin) + ~200 words of commentary + results table |
| `05-results.md` | Results + discussion | **20%** | 1 page | headline results table + 1 figure (calibration PNG) + ~200 words |
| `06-reflection.md` | Reflection + future scope | 10% | 1 page | ≤100-word reflection + 4-5 future-scope bullets |
| `07-summary.md` | One-page summary | 5% | 1 page strict | ~400-word abstract-style summary; squeeze §8 bonus claim + references here if space |

Total self-written text target ≈ **1,800–2,000 words** (down from the
plan's ~3,500). The drafts in each file are intentionally longer than
one page so you cut rather than write from blank; **you will delete
60–70 % of each draft to fit**.

**Fold §8 bonus and references:** The 8-page cap doesn't fit a
standalone bonus page or reference page. Options:
- Put the §8 bonus one-liner at the bottom of §7 (one-pager): "**Bonus
  claims:** trained ML win-prob model (details §4); LLM in live loop
  with numeric validator; public reproducible repo at <URL>."
- Put IEEE references at the bottom of §1 or §3 (whichever has space).
- If overflow is unavoidable, put a `9-references.md` as a 9th page
  and openly acknowledge the cap exception.

## Build options

### Option A — Pandoc → PDF (recommended for a native markdown workflow)

```bash
# One-shot install (macOS): brew install pandoc basictex
# Then from the repo root:
pandoc --from=gfm --pdf-engine=xelatex \
  -V geometry:margin=20mm -V fontsize=11pt \
  -V linkcolor=blue -V urlcolor=blue \
  --resource-path=report \
  -o report/report.pdf \
  report/00-cover.md report/01-problem.md report/02-concept.md \
  report/03-assumptions.md report/04-prototype.md report/05-results.md \
  report/06-reflection.md report/07-summary.md
```

(§8 bonus and the IEEE references are folded into §7 and §1
respectively — this keeps the submission at exactly 8 pages.)

- Each file starts with `\newpage` (via raw LaTeX blocks) so Pandoc
  honours the "new page per section" rule.
- Images in `report/figures/` are referenced relatively, e.g.
  `![Caption](figures/board.png)`.

### Option B — Write the prose here, polish layout in Word / Google Docs

- Faster if you want the formatting flexibility (page headers,
  justified text, exact margins) that university submissions tend
  to want.
- Workflow: fill each `*.md` with the prose, then paste into Word
  one section at a time; apply the "Heading 1" style to the section
  title (that gets you the page header automatically).

Pick one before you start writing — switching halfway is painful.

## Figure checklist

All auto-captured by `scripts/capture-screenshots.ts` into
`report/figures/`:

| File | Captured content | Report section |
|------|------------------|----------------|
| `board-full.png` | RR 98/4 (12.2), 37 % win-prob, Zone C on Phase Comparison, insight ticker visible | **§4 Figure 1** |
| `board-worm.png` | Same pause, Zone C on Worm chart with solid+dashed legend | optional variant |
| `board-manhattan.png` | Same pause, Zone C on Manhattan with wicket dots | optional variant |
| `board-phase.png` | Same pause, Zone C on Phase Comparison bars | optional variant |
| `admin-dashboard.png` | p50 6 ms / p95 12 ms over 17 samples; insight audit 7 triggers / 7 template fallbacks | **§4 Figure 2** |
| `companion-mobile.png` | `/m` Score tab at iPhone-14-Pro viewport | optional §4 figure |
| `companion-batting.png` | `/m` Batting tab (SR colour-coded vs season/career) | optional §4 figure |
| `calibration.png` | Win-prob calibration curve on 2025-26 hold-out | **§5 Figure 3** |

Still to add by hand:
- `architecture.png` — redraw the ASCII block diagram from §2 in
  Excalidraw / Figma, export 1920 × 1080. Target: half-page figure.

Re-capture with: `npm run dev` (one terminal) then
`npx tsx scripts/capture-screenshots.ts`. ~45 s end-to-end.

## Writing order (14-day plan, 8-page cap)

1. **Trim §4 and §5 first** — the drafts have the most to cut. Lock
   in which two figures land in §4 (recommend `board-full.png` and
   `admin-dashboard.png`), which single figure in §5 (`calibration.png`).
2. **§2** — write 250 words max around the block diagram. Pseudo-code
   block can be 6-8 lines.
3. **§3** — assumptions table only; prose is the data-source
   paragraph.
4. **§1** — ~140 words motivation + the two IEEE refs inline.
5. **§6 and §7** — write last since they summarise §4/§5.
6. **§0** — cover page, 10 min.
7. **Fold §8 bonus** into §7's spare space (one line).
