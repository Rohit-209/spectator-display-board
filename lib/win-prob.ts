import type { MatchState } from "./types";
import coeffs from "./win-prob-coeffs.json";

type Coeffs = {
  model: "logreg";
  features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  coef: number[];
  intercept: number;
};

const C = coeffs as Coeffs;

function sigmoid(z: number): number {
  if (z >= 0) {
    const e = Math.exp(-z);
    return 1 / (1 + e);
  }
  const e = Math.exp(z);
  return e / (1 + e);
}

function featureVector(
  runsNeeded: number,
  ballsRemaining: number,
  wicketsInHand: number,
  rrr: number,
  crr: number,
): number[] {
  return [runsNeeded, ballsRemaining, wicketsInHand, rrr, crr];
}

export function winProbability(state: MatchState):
  | { battingTeam: number; bowlingTeam: number }
  | null {
  if (state.currentInnings !== 2 || !state.secondInnings || !state.target) {
    return null;
  }

  const totalOvers = state.meta.totalOvers;
  const inn = state.secondInnings;
  const target = state.target;

  const runsNeeded = Math.max(0, target - inn.runs);
  const ballsRemaining = Math.max(0, totalOvers * 6 - inn.legalBallsTotal);
  const wicketsInHand = Math.max(0, 10 - inn.wickets);

  if (runsNeeded <= 0) return { battingTeam: 1, bowlingTeam: 0 };
  if (ballsRemaining <= 0 || wicketsInHand <= 0)
    return { battingTeam: 0, bowlingTeam: 1 };

  const rrr = (runsNeeded / ballsRemaining) * 6;
  const crr = inn.legalBallsTotal > 0 ? (inn.runs / inn.legalBallsTotal) * 6 : 0;

  const x = featureVector(runsNeeded, ballsRemaining, wicketsInHand, rrr, crr);
  let z = C.intercept;
  for (let i = 0; i < x.length; i++) {
    const scaled = (x[i] - C.scaler_mean[i]) / C.scaler_scale[i];
    z += C.coef[i] * scaled;
  }
  const p = sigmoid(z);
  const clamped = Math.max(0.01, Math.min(0.99, p));
  return { battingTeam: clamped, bowlingTeam: 1 - clamped };
}

export function projectedScore(state: MatchState): number | null {
  if (state.currentInnings !== 1) return null;
  const inn = state.firstInnings;
  if (inn.legalBallsTotal < 6) return null;
  const totalBalls = state.meta.totalOvers * 6;
  const ballsRemaining = totalBalls - inn.legalBallsTotal;
  const crr = (inn.runs / inn.legalBallsTotal) * 6;
  const projRate = crr * 1.05;
  return Math.round(inn.runs + (projRate / 6) * ballsRemaining);
}
