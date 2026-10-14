import type { MatchState } from "@/lib/types";

export function ZoneD({ state }: { state: MatchState }) {
  const wp = state.winProbability;
  const second = state.secondInnings;

  if (!wp || !second) {
    return (
      <div className="col-span-3 bg-panel rounded-xl p-5 flex flex-col min-h-[380px] items-center justify-center text-slate-500">
        <div className="text-xs uppercase tracking-widest">Projected</div>
        <div className="text-6xl font-black tabular text-accent-2 mt-2">
          {state.projectedScore ?? "—"}
        </div>
        <div className="text-xs text-slate-400 mt-2">
          End-of-innings estimate
        </div>
      </div>
    );
  }

  const battingPct = Math.round(wp.battingTeam * 100);
  const bowlingPct = 100 - battingPct;
  const battingTeam = second.team;
  const bowlingTeam =
    state.meta.teams.find((t) => t !== battingTeam) ?? "Bowling";
  const abbr = (s: string) =>
    s
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 4)
      .toUpperCase();

  return (
    <div className="col-span-3 bg-panel rounded-xl p-5 flex flex-col min-h-[380px]">
      <div className="text-xs uppercase tracking-widest text-slate-500">
        Win probability
      </div>
      <div className="flex-1 flex items-end gap-4 mt-3">
        <Bar label={abbr(battingTeam)} pct={battingPct} color="bg-accent-2" />
        <Bar label={abbr(bowlingTeam)} pct={bowlingPct} color="bg-sky-500" />
      </div>
    </div>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="text-2xl font-black tabular">{pct}%</div>
      <div className="w-full h-32 bg-slate-800 rounded-md overflow-hidden flex items-end mt-2">
        <div
          className={`w-full ${color} transition-all duration-700 ease-out`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 mt-2">{label}</div>
    </div>
  );
}
