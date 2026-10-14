import type {
  BallEvent,
  BatterCard,
  BowlerCard,
  InningsState,
  MatchMeta,
  MatchState,
} from "./types";

export function initialInnings(team: string): InningsState {
  return {
    team,
    runs: 0,
    wickets: 0,
    overs: "0.0",
    legalBallsTotal: 0,
    extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, penalty: 0, total: 0 },
    runsPerOver: [],
    wicketsPerOver: [],
    wormPoints: [{ ball: 0, runs: 0 }],
    batters: {},
    bowlers: {},
    batterOrder: [],
    bowlerOrder: [],
    currentStriker: null,
    currentNonStriker: null,
    currentBowler: null,
    partnership: { runs: 0, balls: 0, batterA: null, batterB: null },
    lastEvent: null,
  };
}

export function initialState(meta: MatchMeta): MatchState {
  return {
    meta,
    currentInnings: 1,
    firstInnings: initialInnings(meta.battingFirst),
    secondInnings: null,
    target: null,
    winProbability: null,
    projectedScore: null,
    lastEvent: null,
    insight: null,
  };
}

function emptyBatter(name: string): BatterCard {
  return {
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    strikeRate: 0,
    isOut: false,
    outDescription: null,
  };
}

function emptyBowler(name: string): BowlerCard {
  return {
    name,
    overs: "0.0",
    legalBalls: 0,
    runs: 0,
    wickets: 0,
    economy: 0,
    dots: 0,
  };
}

function formatOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function applyToInnings(innings: InningsState, event: BallEvent): InningsState {
  const next: InningsState = {
    ...innings,
    extras: { ...innings.extras },
    runsPerOver: [...innings.runsPerOver],
    wicketsPerOver: [...innings.wicketsPerOver],
    wormPoints: [...innings.wormPoints],
    batters: { ...innings.batters },
    bowlers: { ...innings.bowlers },
    batterOrder: [...innings.batterOrder],
    bowlerOrder: [...innings.bowlerOrder],
    partnership: { ...innings.partnership },
  };

  if (!next.batters[event.batter]) {
    next.batters[event.batter] = emptyBatter(event.batter);
    next.batterOrder.push(event.batter);
  }
  if (!next.batters[event.nonStriker]) {
    next.batters[event.nonStriker] = emptyBatter(event.nonStriker);
    next.batterOrder.push(event.nonStriker);
  }
  if (!next.bowlers[event.bowler]) {
    next.bowlers[event.bowler] = emptyBowler(event.bowler);
    next.bowlerOrder.push(event.bowler);
  }

  const batter = { ...next.batters[event.batter] };
  const bowler = { ...next.bowlers[event.bowler] };

  batter.runs += event.runsBatter;
  if (event.runsBatter === 4) batter.fours += 1;
  if (event.runsBatter === 6) batter.sixes += 1;
  if (event.isLegalDelivery) {
    batter.balls += 1;
  }
  batter.strikeRate = batter.balls > 0 ? (batter.runs / batter.balls) * 100 : 0;

  const bowlerRunsConceded =
    event.runsBatter +
    (event.extraType === "wides" || event.extraType === "noballs"
      ? event.runsExtras
      : 0);
  bowler.runs += bowlerRunsConceded;
  if (event.isLegalDelivery) bowler.legalBalls += 1;
  if (event.runsTotal === 0 && event.isLegalDelivery) bowler.dots += 1;
  bowler.overs = formatOvers(bowler.legalBalls);
  bowler.economy = bowler.legalBalls > 0 ? (bowler.runs / bowler.legalBalls) * 6 : 0;

  next.runs += event.runsTotal;
  if (event.extraType) {
    next.extras[event.extraType] += event.runsExtras;
    next.extras.total += event.runsExtras;
  }
  if (event.isLegalDelivery) {
    next.legalBallsTotal += 1;
  }
  next.overs = formatOvers(next.legalBallsTotal);

  while (next.runsPerOver.length <= event.over) {
    next.runsPerOver.push(0);
    next.wicketsPerOver.push(0);
  }
  next.runsPerOver[event.over] += event.runsTotal;

  next.partnership.runs += event.runsTotal;
  if (event.isLegalDelivery) next.partnership.balls += 1;

  if (event.isWicket && event.playerOut) {
    const out = { ...next.batters[event.playerOut] };
    out.isOut = true;
    out.outDescription = describeWicket(event);
    next.batters[event.playerOut] = out;
    bowler.wickets += 1;
    next.wickets += 1;
    next.wicketsPerOver[event.over] += 1;
    next.partnership = {
      runs: 0,
      balls: 0,
      batterA: null,
      batterB: null,
    };
  }

  next.batters[event.batter] = batter;
  next.bowlers[event.bowler] = bowler;

  const striker = resolveStriker(event);
  const nonStriker = resolveNonStriker(event);
  next.currentStriker = striker;
  next.currentNonStriker = nonStriker;
  next.currentBowler = event.bowler;
  if (striker && nonStriker) {
    if (!next.partnership.batterA) {
      next.partnership.batterA = striker;
      next.partnership.batterB = nonStriker;
    }
  }

  next.wormPoints.push({ ball: next.legalBallsTotal, runs: next.runs });
  next.lastEvent = event;
  return next;
}

function describeWicket(event: BallEvent): string {
  const kind = event.wicketKind ?? "out";
  return `${kind} b ${event.bowler}`;
}

function resolveStriker(event: BallEvent): string {
  if (event.isWicket && event.playerOut === event.batter) {
    return event.nonStriker;
  }
  const rotate = event.runsBatter % 2 === 1;
  return rotate ? event.nonStriker : event.batter;
}

function resolveNonStriker(event: BallEvent): string {
  if (event.isWicket && event.playerOut === event.batter) {
    return event.batter;
  }
  const rotate = event.runsBatter % 2 === 1;
  return rotate ? event.batter : event.nonStriker;
}

export function applyEvent(state: MatchState, event: BallEvent): MatchState {
  const next: MatchState = { ...state, lastEvent: event };

  if (event.innings === 1) {
    next.firstInnings = applyToInnings(state.firstInnings, event);
  } else {
    if (state.currentInnings === 1) {
      next.currentInnings = 2;
      next.target = state.firstInnings.runs + 1;
      next.secondInnings = initialInnings(state.meta.battingSecond);
    }
    next.secondInnings = applyToInnings(
      next.secondInnings ?? initialInnings(state.meta.battingSecond),
      event,
    );
  }

  return next;
}

export function replayAll(meta: MatchMeta, events: BallEvent[]): MatchState {
  let s = initialState(meta);
  for (const e of events) s = applyEvent(s, e);
  return s;
}

export function currentRunRate(innings: InningsState): number {
  if (innings.legalBallsTotal === 0) return 0;
  return (innings.runs / innings.legalBallsTotal) * 6;
}

export function requiredRunRate(
  innings: InningsState,
  target: number,
  totalOvers: number,
): number | null {
  const ballsRemaining = totalOvers * 6 - innings.legalBallsTotal;
  if (ballsRemaining <= 0) return null;
  const runsNeeded = target - innings.runs;
  if (runsNeeded <= 0) return 0;
  return (runsNeeded / ballsRemaining) * 6;
}
