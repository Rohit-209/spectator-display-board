import type { MatchState } from "./types";

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

  const z =
    1.6 -
    0.28 * (rrr - 8) +
    0.22 * (wicketsInHand - 5) +
    0.015 * (ballsRemaining - 60) +
    0.08 * (crr - 8);

  const p = 1 / (1 + Math.exp(-z));
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
