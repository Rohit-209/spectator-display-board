export type BallEvent = {
  matchId: string;
  innings: 1 | 2;
  over: number;
  ballInOver: number;
  legalBallInOver: number;
  globalBallIndex: number;
  batter: string;
  nonStriker: string;
  bowler: string;
  runsBatter: number;
  runsExtras: number;
  runsTotal: number;
  extraType: "wides" | "noballs" | "byes" | "legbyes" | "penalty" | null;
  isLegalDelivery: boolean;
  isWicket: boolean;
  wicketKind: string | null;
  playerOut: string | null;
  emittedAt?: number;
};

export type BatterCard = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  outDescription: string | null;
};

export type BowlerCard = {
  name: string;
  overs: string;
  legalBalls: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number;
};

export type InningsState = {
  team: string;
  runs: number;
  wickets: number;
  overs: string;
  legalBallsTotal: number;
  extras: {
    wides: number;
    noballs: number;
    byes: number;
    legbyes: number;
    penalty: number;
    total: number;
  };
  runsPerOver: number[];
  wicketsPerOver: number[];
  wormPoints: { ball: number; runs: number }[];
  batters: Record<string, BatterCard>;
  bowlers: Record<string, BowlerCard>;
  batterOrder: string[];
  bowlerOrder: string[];
  currentStriker: string | null;
  currentNonStriker: string | null;
  currentBowler: string | null;
  partnership: {
    runs: number;
    balls: number;
    batterA: string | null;
    batterB: string | null;
  };
  lastEvent: BallEvent | null;
};

export type MatchMeta = {
  matchId: string;
  teams: [string, string];
  battingFirst: string;
  battingSecond: string;
  city: string | null;
  date: string | null;
  venue: string | null;
  totalOvers: number;
};

export type MatchState = {
  meta: MatchMeta;
  currentInnings: 1 | 2;
  firstInnings: InningsState;
  secondInnings: InningsState | null;
  target: number | null;
  winProbability: { battingTeam: number; bowlingTeam: number } | null;
  projectedScore: number | null;
  lastEvent: BallEvent | null;
  insight: InsightMessage | null;
};

export type InsightMessage = {
  id: string;
  text: string;
  trigger: string;
  factKeys: string[];
  source: "llm" | "template";
  createdAt: number;
};

export type ReplayStatus = {
  loaded: boolean;
  matchId: string | null;
  playing: boolean;
  speed: number;
  cursor: number;
  total: number;
  completed: boolean;
};

export type StreamFrame =
  | { kind: "state"; state: MatchState; status: ReplayStatus; renderedAt?: number }
  | { kind: "status"; status: ReplayStatus }
  | { kind: "insight"; insight: InsightMessage };
