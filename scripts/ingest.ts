/**
 * Walk model/data/raw/*.json and populate SQLite:
 *   - matches  (metadata)
 *   - batter_season_stats, batter_career_stats  (for comparison lookups)
 *
 * Idempotent: INSERT OR REPLACE on the primary keys. Run as:
 *   npm run db:ingest
 */
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../lib/db";

const RAW_DIR = path.resolve(process.cwd(), "model/data/raw");
const KEY_SEP = "\x1f";

type Delivery = {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: { batter: number; extras: number; total: number };
  extras?: Record<string, number>;
  wickets?: Array<{ player_out: string; kind: string }>;
};

type Over = { over: number; deliveries: Delivery[] };
type Innings = { team: string; overs: Over[] };

type Match = {
  info: {
    teams: string[];
    city?: string;
    venue?: string;
    dates?: string[];
    overs?: number;
    season?: string | number;
    outcome?: { winner?: string };
    match_type?: string;
  };
  innings: Innings[];
};

type BatterTally = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highest: number;
  innings: number;
};

function tally(): BatterTally {
  return { runs: 0, balls: 0, fours: 0, sixes: 0, highest: 0, innings: 0 };
}

function keySeason(name: string, season: string): string {
  return name + KEY_SEP + season;
}

function roll(acc: Map<string, BatterTally>, key: string, add: BatterTally): void {
  const cur = acc.get(key);
  if (!cur) {
    acc.set(key, { ...add });
    return;
  }
  cur.runs += add.runs;
  cur.balls += add.balls;
  cur.fours += add.fours;
  cur.sixes += add.sixes;
  cur.innings += add.innings;
  if (add.highest > cur.highest) cur.highest = add.highest;
}

function processMatch(
  m: Match,
  seasonAccum: Map<string, BatterTally>,
  careerAccum: Map<string, BatterTally>,
): { teamA: string; teamB: string; battingFirst: string; battingSecond: string; season: string } | null {
  if (m.info.match_type !== "T20") return null;
  const [teamA, teamB] = m.info.teams;
  const season = String(m.info.season ?? "");
  const battingFirst = m.innings[0]?.team ?? teamA;
  const battingSecond = battingFirst === teamA ? teamB : teamA;

  for (const inn of m.innings.slice(0, 2)) {
    const perBatter = new Map<string, BatterTally>();
    const touch = (name: string) => {
      if (!perBatter.has(name)) perBatter.set(name, tally());
      return perBatter.get(name)!;
    };
    for (const over of inn.overs ?? []) {
      for (const d of over.deliveries ?? []) {
        const extras = d.extras ?? {};
        const isLegal = !extras.wides && !extras.noballs;
        const b = touch(d.batter);
        touch(d.non_striker);
        b.runs += d.runs.batter;
        if (isLegal) b.balls += 1;
        if (d.runs.batter === 4) b.fours += 1;
        if (d.runs.batter === 6) b.sixes += 1;
      }
    }
    for (const [name, t] of perBatter) {
      t.innings = 1;
      t.highest = t.runs;
      roll(seasonAccum, keySeason(name, season), t);
      roll(careerAccum, name, t);
    }
  }

  return { teamA, teamB, battingFirst, battingSecond, season };
}

async function main(): Promise<void> {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`No matches at ${RAW_DIR}. Run the model fetch first:`);
    console.error(`  curl -sSL -o /tmp/ipl_json.zip https://cricsheet.org/downloads/ipl_json.zip`);
    console.error(`  (cd model/data/raw && unzip -q /tmp/ipl_json.zip)`);
    process.exit(1);
  }

  const db = getDb();
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  console.log(`Ingesting ${files.length} match files from ${RAW_DIR} ...`);

  const seasonAcc = new Map<string, BatterTally>();
  const careerAcc = new Map<string, BatterTally>();

  const upsertMatch = db.prepare(
    `INSERT OR REPLACE INTO matches
       (match_id, team_a, team_b, batting_first, batting_second,
        season, date, venue, city, winner, total_overs)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  );

  let matchCount = 0;

  const run = db.transaction(() => {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const matchId = f.replace(/\.json$/, "");
      let raw: Match;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), "utf8"));
      } catch (err) {
        console.warn(`  skip ${f}: ${(err as Error).message}`);
        continue;
      }
      const summary = processMatch(raw, seasonAcc, careerAcc);
      if (!summary) continue;
      upsertMatch.run(
        matchId,
        summary.teamA,
        summary.teamB,
        summary.battingFirst,
        summary.battingSecond,
        summary.season,
        raw.info.dates?.[0] ?? null,
        raw.info.venue ?? null,
        raw.info.city ?? null,
        raw.info.outcome?.winner ?? null,
        raw.info.overs ?? 20,
      );
      matchCount += 1;
      if ((i + 1) % 200 === 0) {
        console.log(`  processed ${i + 1}/${files.length}`);
      }
    }
  });
  run();

  const upsertSeason = db.prepare(
    `INSERT OR REPLACE INTO batter_season_stats
       (batter, season, innings, runs, balls, fours, sixes, highest)
     VALUES (?,?,?,?,?,?,?,?)`,
  );
  const upsertCareer = db.prepare(
    `INSERT OR REPLACE INTO batter_career_stats
       (batter, innings, runs, balls, fours, sixes, highest)
     VALUES (?,?,?,?,?,?,?)`,
  );
  const flush = db.transaction(() => {
    for (const [key, t] of seasonAcc) {
      const [batter, season] = key.split(KEY_SEP);
      upsertSeason.run(batter, season, t.innings, t.runs, t.balls, t.fours, t.sixes, t.highest);
    }
    for (const [batter, t] of careerAcc) {
      upsertCareer.run(batter, t.innings, t.runs, t.balls, t.fours, t.sixes, t.highest);
    }
  });
  flush();

  console.log(
    `done: ${matchCount} matches, ${seasonAcc.size} batter-season rows, ${careerAcc.size} batter-career rows`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
