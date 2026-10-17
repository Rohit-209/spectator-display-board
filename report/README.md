# Assignment-2 report scaffold

PDF deliverable for BITS Pilani · Intro to Sports Engineering · Sem-I
2026-27, Assignment #2 (Idea #15 — spectator display board).

**Hard constraints from the brief:**

- One PDF, submitted on Nalanda, filename contains both student IDs.
- Max **8 pages** per the first paragraph; **12–15 pages / ~3500 words**
  per the Expected Effort line. Treat 12–15 as the real envelope and
  only overflow 8 if content demands it.
- Each section starts on a new page; section title in the page header.
- Deadline reads **"31st October 2025"** but the semester header is
  Sem-I 2026-27 — almost certainly a typo for 31 Oct 2026.
  **Confirm with the prof or Nalanda before relying on either date.**

## Section map

| File | Section | Weight | Word budget | Hard rules |
|------|---------|-------:|------------:|------------|
| `00-cover.md` | Cover page | 5% | ~50 | — |
| `01-problem.md` | Problem definition | 10% | **≤150 words motivation** + 2 IEEE refs | — |
| `02-concept.md` | Concept / methodology | 20% | ~700 | Needs block diagram + pseudo-code |
| `03-assumptions.md` | Assumptions + data source | — (bundled into §2 scoring in practice) | ~250 | IEEE refs for every borrowed value |
| `04-prototype.md` | Prototype / testing | **30%** | ~900 | Screenshots + graphs mandatory |
| `05-results.md` | Results + discussion | **20%** | ~700 | Tables / graphs preferred |
| `06-reflection.md` | Reflection + future scope | 10% | **≤100 words reflection** + extensions | — |
| `07-summary.md` | One-page summary | 5% | ~450 (strict 1 page) | — |
| `08-bonus.md` | Bonus | +10% | ~150 | **Needs a hosted video link** |
| `references.md` | IEEE references | — | — | Consolidate all citations |

Total self-written text target ≈ **3,350–3,500 words**.

## Build options

### Option A — Pandoc → PDF (recommended for a native markdown workflow)

```bash
# One-shot install (macOS): brew install pandoc basictex
# Then from the repo root:
pandoc --from=gfm --pdf-engine=xelatex \
  -V geometry:margin=20mm -V fontsize=11pt \
  -V linkcolor=blue -V urlcolor=blue \
  -o report/report.pdf \
  report/00-cover.md report/01-problem.md report/02-concept.md \
  report/03-assumptions.md report/04-prototype.md report/05-results.md \
  report/06-reflection.md report/07-summary.md report/08-bonus.md \
  report/references.md
```

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

Store in `report/figures/`. These are the figures the scaffold
already references:

- `board-full.png` — full board screenshot during a chase (grab from
  `localhost:3000` mid 2nd innings; crop to the five zones)
- `admin-dashboard.png` — admin page showing latency CSV + insight
  rejection rate + engagement summary
- `architecture.png` — redraw the §2 block diagram cleanly (Excalidraw
  or Figma; export 1920 × 1080 PNG)
- `calibration.png` — copy from `../model/out/calibration.png`
- `companion-mobile.png` — screenshot of `/m` on a phone-sized viewport

Add any additional figures you reference in `04-prototype.md` /
`05-results.md`.

## Writing order (14-day plan)

1. §4 and §5 first — our raw material is already in the repo
2. §2 and §3 next — pull straight from `Display_Board_Plan.pdf §3`
3. §1 and references
4. §6 and §7 last — these summarise everything above
5. §0 and §8 are 10-minute slots at the very end
