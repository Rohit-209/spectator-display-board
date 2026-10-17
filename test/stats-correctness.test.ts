/**
 * Plan §5.1 "Stats correctness" result.
 *
 * For each sampled match: compute expected totals directly from the raw
 * Cricsheet JSON, replay the match through parseCricsheetMatch + applyEvent,
 * and assert deep equality. The reducer is the only logic under test; the
 * raw-JSON side is a plain sum.
 *
 * By default this samples from board/data/matches (3 bundled matches). To
 * run the plan's 20-match sweep, point MATCH_SOURCE at the Cricsheet dump,
 * e.g. MATCH_SOURCE=../model/data/raw npm test.
 */
import { describe, test, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { parseCricsheetMatch } from "@/lib/parse-cricsheet";
import { applyEvent, initialState } from "@/lib/stats";

const DEFAULT_SOURCE = path.resolve(process.cwd(), "data/matches");
const SOURCE_DIR = path.resolve(
  process.cwd(),
  process.env.MATCH_SOURCE ?? DEFAULT_SOURCE,
);
const SAMPLE_SIZE = Number(process.env.MATCH_SAMPLE ?? 20);
const SEED = Number(process.env.MATCH_SEED ?? 1337);

type Expected = {
  innings: Array<{
    team: string;
    runs: number;
    wickets: number;
    legalBalls: number;
    extras: {
      wides: number;
      noballs: number;
      byes: number;
      legbyes: number;
      penalty: number;
      total: number;
    };
    batters: Record<string, { runs: number; balls: number; fours: number; sixes: number }>;
    bowlers: Record<string, { runs: number; wickets: number; legalBalls: number; dots: number }>;
  }>;
};

function sampleMatches(dir: string, n: number, seed: number): string[] {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length <= n) return files;
  // Deterministic shuffle so the report can quote a reproducible sample.
  const rnd = mulberry32(seed);
  const shuffled = [...files];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickExtra(d: any): keyof Expected["innings"][0]["extras"] | null {
  const e = d.extras ?? {};
  if (e.wides) return "wides";
  if (e.noballs) return "noballs";
  if (e.byes) return "byes";
  if (e.legbyes) return "legbyes";
  if (e.penalty) return "penalty";
  return null;
}

function expectedFromRaw(raw: any): Expected {
  const innings: Expected["innings"] = [];
  // Super overs are not modelled by the board — compare the first 2 innings only.
  for (const inn of (raw.innings ?? []).slice(0, 2)) {
    const bucket: Expected["innings"][number] = {
      team: inn.team,
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0, total: 0 },
      batters: {},
      bowlers: {},
    };
    for (const over of inn.overs ?? []) {
      for (const d of over.deliveries ?? []) {
        bucket.runs += d.runs.total;
        const extra = pickExtra(d);
        const isLegal = extra !== "wides" && extra !== "noballs";
        if (extra) {
          bucket.extras[extra] += d.runs.extras;
          bucket.extras.total += d.runs.extras;
        }
        if (isLegal) bucket.legalBalls += 1;
        if (d.wickets) bucket.wickets += d.wickets.length;

        const b = (bucket.batters[d.batter] ??= { runs: 0, balls: 0, fours: 0, sixes: 0 });
        b.runs += d.runs.batter;
        if (isLegal) b.balls += 1;
        if (d.runs.batter === 4) b.fours += 1;
        if (d.runs.batter === 6) b.sixes += 1;
        // Match the reducer: a batter who comes in at the non-striker's end
        // still gets a card even if they never face a ball before being dismissed.
        bucket.batters[d.non_striker] ??= { runs: 0, balls: 0, fours: 0, sixes: 0 };

        const bw = (bucket.bowlers[d.bowler] ??= {
          runs: 0,
          wickets: 0,
          legalBalls: 0,
          dots: 0,
        });
        const concededByBowler =
          d.runs.batter + (extra === "wides" || extra === "noballs" ? d.runs.extras : 0);
        bw.runs += concededByBowler;
        if (isLegal) bw.legalBalls += 1;
        if (isLegal && d.runs.total === 0) bw.dots += 1;
        if (d.wickets) {
          for (const w of d.wickets) {
            // Only credit bowler-earned dismissals, matching lib/stats.ts behaviour
            if (!["run out", "retired hurt", "retired out", "obstructing the field"].includes(w.kind)) {
              bw.wickets += 1;
            }
          }
        }
      }
    }
    innings.push(bucket);
  }
  return { innings };
}

function actualFromReducer(matchId: string, raw: any): Expected {
  const { meta, events } = parseCricsheetMatch(matchId, raw);
  let state = initialState(meta);
  for (const ev of events) state = applyEvent(state, ev);

  const toBucket = (inn: any): Expected["innings"][number] => ({
    team: inn.team,
    runs: inn.runs,
    wickets: inn.wickets,
    legalBalls: inn.legalBallsTotal,
    extras: {
      wides: inn.extras.wides,
      noballs: inn.extras.noballs,
      byes: inn.extras.byes,
      legbyes: inn.extras.legbyes,
      penalty: inn.extras.penalty,
      total: inn.extras.total,
    },
    batters: Object.fromEntries(
      Object.entries<any>(inn.batters).map(([n, b]) => [
        n,
        { runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes },
      ]),
    ),
    bowlers: Object.fromEntries(
      Object.entries<any>(inn.bowlers).map(([n, b]) => [
        n,
        { runs: b.runs, wickets: b.wickets, legalBalls: b.legalBalls, dots: b.dots },
      ]),
    ),
  });

  const innings: Expected["innings"] = [toBucket(state.firstInnings)];
  if (state.secondInnings) innings.push(toBucket(state.secondInnings));
  return { innings };
}

const files = fs.existsSync(SOURCE_DIR)
  ? sampleMatches(SOURCE_DIR, SAMPLE_SIZE, SEED)
  : [];

describe(`stats correctness vs Cricsheet (${files.length} matches from ${SOURCE_DIR})`, () => {
  if (files.length === 0) {
    test.skip("no match sources found", () => {});
    return;
  }
  for (const f of files) {
    const matchId = f.replace(/\.json$/, "");
    test(`match ${matchId}`, () => {
      const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, f), "utf8"));
      const expected = expectedFromRaw(raw);
      const actual = actualFromReducer(matchId, raw);
      expect(actual).toEqual(expected);
    });
  }
});
