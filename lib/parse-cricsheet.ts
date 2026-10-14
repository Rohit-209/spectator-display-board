import type { BallEvent, MatchMeta } from "./types";

type CricsheetDelivery = {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: { batter: number; extras: number; total: number };
  extras?: Partial<Record<"wides" | "noballs" | "byes" | "legbyes" | "penalty", number>>;
  wickets?: Array<{ player_out: string; kind: string }>;
};

type CricsheetOver = { over: number; deliveries: CricsheetDelivery[] };
type CricsheetInnings = { team: string; overs: CricsheetOver[] };

type CricsheetMatch = {
  info: {
    teams: string[];
    city?: string;
    venue?: string;
    dates?: string[];
    overs?: number;
    outcome?: { winner?: string; by?: { runs?: number; wickets?: number } };
  };
  innings: CricsheetInnings[];
};

export function parseCricsheetMatch(
  matchId: string,
  raw: unknown,
): { meta: MatchMeta; events: BallEvent[] } {
  const match = raw as CricsheetMatch;
  const [teamA, teamB] = match.info.teams;
  const battingFirst = match.innings[0]?.team ?? teamA;
  const battingSecond = battingFirst === teamA ? teamB : teamA;

  const meta: MatchMeta = {
    matchId,
    teams: [teamA, teamB],
    battingFirst,
    battingSecond,
    city: match.info.city ?? null,
    date: match.info.dates?.[0] ?? null,
    venue: match.info.venue ?? null,
    totalOvers: match.info.overs ?? 20,
  };

  const events: BallEvent[] = [];
  let globalBallIndex = 0;

  for (let i = 0; i < match.innings.length; i++) {
    const innings = (i + 1) as 1 | 2;
    const inningsData = match.innings[i];
    let legalBallInOver = 0;
    let prevOver = -1;

    for (const over of inningsData.overs) {
      if (over.over !== prevOver) {
        legalBallInOver = 0;
        prevOver = over.over;
      }
      let ballInOver = 0;
      for (const d of over.deliveries) {
        ballInOver += 1;
        const extraType = pickExtraType(d.extras);
        const isLegalDelivery = extraType !== "wides" && extraType !== "noballs";
        if (isLegalDelivery) legalBallInOver += 1;

        const wicket = d.wickets?.[0] ?? null;

        events.push({
          matchId,
          innings,
          over: over.over,
          ballInOver,
          legalBallInOver,
          globalBallIndex,
          batter: d.batter,
          nonStriker: d.non_striker,
          bowler: d.bowler,
          runsBatter: d.runs.batter,
          runsExtras: d.runs.extras,
          runsTotal: d.runs.total,
          extraType,
          isLegalDelivery,
          isWicket: !!wicket,
          wicketKind: wicket?.kind ?? null,
          playerOut: wicket?.player_out ?? null,
        });
        globalBallIndex += 1;
      }
    }
  }

  return { meta, events };
}

function pickExtraType(
  extras: CricsheetDelivery["extras"],
): BallEvent["extraType"] {
  if (!extras) return null;
  if (extras.wides) return "wides";
  if (extras.noballs) return "noballs";
  if (extras.byes) return "byes";
  if (extras.legbyes) return "legbyes";
  if (extras.penalty) return "penalty";
  return null;
}
