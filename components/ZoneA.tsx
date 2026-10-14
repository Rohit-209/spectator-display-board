import type { MatchState } from "@/lib/types";
import { currentRunRate, requiredRunRate } from "@/lib/stats";

export function ZoneA({ state }: { state: MatchState }) {
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;
  const crr = currentRunRate(inn);
  const rrr =
    state.target !== null
      ? requiredRunRate(inn, state.target, state.meta.totalOvers)
      : null;

  const abbr = inn.team
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();

  const ballsRemaining = state.meta.totalOvers * 6 - inn.legalBallsTotal;
  const runsNeeded =
    state.target !== null ? Math.max(0, state.target - inn.runs) : null;

  return (
    <div className="col-span-12 bg-panel/80 border-b-4 border-accent rounded-t-xl px-8 py-5 flex items-center justify-between gap-6">
      <div className="flex items-baseline gap-5">
        <span className="text-5xl font-black tracking-tight">{abbr}</span>
        <span className="text-6xl font-black tabular text-accent">
          {inn.runs}/{inn.wickets}
        </span>
        <span className="text-3xl text-slate-300 tabular">({inn.overs})</span>
      </div>
      <div className="text-right text-slate-200">
        {state.target !== null ? (
          <>
            <div className="text-xl">
              Target{" "}
              <span className="font-bold text-accent-2">{state.target}</span>{" "}
              <span className="text-slate-400">·</span> Need{" "}
              <span className="font-bold text-accent-2">{runsNeeded}</span> off{" "}
              <span className="font-bold text-accent-2">{ballsRemaining}</span>
            </div>
            <div className="text-base text-slate-400 tabular">
              CRR {crr.toFixed(2)} &nbsp; RRR {rrr === null ? "—" : rrr.toFixed(2)}
            </div>
          </>
        ) : (
          <>
            <div className="text-xl text-slate-400">1st innings</div>
            <div className="text-base text-slate-400 tabular">
              CRR {crr.toFixed(2)}
              {state.projectedScore !== null && (
                <> &nbsp; Proj {state.projectedScore}</>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
