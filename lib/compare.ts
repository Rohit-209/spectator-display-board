import { getDb } from "./db";

export type BatterStats = {
  batter: string;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highest: number;
  strikeRate: number;
  average: number;
};

export type BatterComparison = {
  batter: string;
  season: string | null;
  seasonStats: BatterStats | null;
  careerStats: BatterStats | null;
};

function toStats(row: Record<string, unknown> | undefined, batter: string): BatterStats | null {
  if (!row) return null;
  const runs = Number(row.runs ?? 0);
  const balls = Number(row.balls ?? 0);
  const innings = Number(row.innings ?? 0);
  return {
    batter,
    innings,
    runs,
    balls,
    fours: Number(row.fours ?? 0),
    sixes: Number(row.sixes ?? 0),
    highest: Number(row.highest ?? 0),
    strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
    average: innings > 0 ? runs / innings : 0,
  };
}

export function getBatterComparison(
  batter: string,
  season: string | null,
): BatterComparison {
  const db = getDb();
  const career = db
    .prepare(
      `SELECT innings, runs, balls, fours, sixes, highest
         FROM batter_career_stats WHERE batter = ?`,
    )
    .get(batter) as Record<string, unknown> | undefined;
  const seasonRow =
    season === null
      ? undefined
      : (db
          .prepare(
            `SELECT innings, runs, balls, fours, sixes, highest
               FROM batter_season_stats
               WHERE batter = ? AND season = ?`,
          )
          .get(batter, season) as Record<string, unknown> | undefined);

  return {
    batter,
    season,
    seasonStats: toStats(seasonRow, batter),
    careerStats: toStats(career, batter),
  };
}

export function getMatchSeason(matchId: string): string | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT season FROM matches WHERE match_id = ?`)
    .get(matchId) as { season: string | null } | undefined;
  return row?.season ?? null;
}
