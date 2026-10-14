"use client";
import type { InningsState, MatchState } from "@/lib/types";

export function WormChart({ state }: { state: MatchState }) {
  const first = state.firstInnings;
  const second = state.secondInnings;
  const totalBalls = state.meta.totalOvers * 6;
  const maxRuns = Math.max(
    first.runs,
    second?.runs ?? 0,
    state.target ?? 0,
    40,
  );

  const w = 760;
  const h = 220;
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 24;

  const xFor = (ball: number) =>
    padL + (ball / totalBalls) * (w - padL - padR);
  const yFor = (runs: number) =>
    padT + (1 - runs / maxRuns) * (h - padT - padB);

  const linePath = (inn: InningsState) =>
    inn.wormPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.ball)} ${yFor(p.runs)}`)
      .join(" ");

  const ovs = Array.from({ length: state.meta.totalOvers + 1 }, (_, i) => i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <rect x={0} y={0} width={w} height={h} fill="transparent" />
      {ovs
        .filter((o) => o % 5 === 0)
        .map((o) => (
          <g key={o}>
            <line
              x1={xFor(o * 6)}
              x2={xFor(o * 6)}
              y1={padT}
              y2={h - padB}
              stroke="#1e293b"
              strokeDasharray="3 4"
            />
            <text
              x={xFor(o * 6)}
              y={h - 6}
              fontSize={10}
              fill="#64748b"
              textAnchor="middle"
            >
              {o}
            </text>
          </g>
        ))}
      <path d={linePath(first)} stroke="#38bdf8" fill="none" strokeWidth={2.5} />
      {second && (
        <path
          d={linePath(second)}
          stroke="#f59e0b"
          fill="none"
          strokeWidth={2.5}
        />
      )}
      {state.target !== null && (
        <line
          x1={padL}
          x2={w - padR}
          y1={yFor(state.target)}
          y2={yFor(state.target)}
          stroke="#64748b"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
      )}
      <text x={padL} y={padT + 10} fontSize={11} fill="#38bdf8">
        {first.team}
      </text>
      {second && (
        <text x={padL + 90} y={padT + 10} fontSize={11} fill="#f59e0b">
          {second.team}
        </text>
      )}
    </svg>
  );
}

export function Manhattan({ innings }: { innings: InningsState }) {
  const w = 760;
  const h = 220;
  const padL = 30;
  const padR = 10;
  const padT = 20;
  const padB = 24;
  const bars = innings.runsPerOver;
  const wickets = innings.wicketsPerOver;
  const maxRuns = Math.max(...bars, 10);
  const barW = (w - padL - padR) / Math.max(bars.length, 20);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      {bars.map((runs, i) => {
        const x = padL + i * barW + 2;
        const barHeight = ((h - padT - padB) * runs) / maxRuns;
        const y = h - padB - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW - 4}
              height={barHeight}
              fill="#22c55e"
              rx={2}
            />
            {wickets[i] > 0 && (
              <circle
                cx={x + (barW - 4) / 2}
                cy={y - 6}
                r={4}
                fill="#ef4444"
              />
            )}
            {i % 2 === 0 && (
              <text
                x={x + (barW - 4) / 2}
                y={h - 8}
                fontSize={10}
                fill="#64748b"
                textAnchor="middle"
              >
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function PhaseCompare({ state }: { state: MatchState }) {
  const phases = [
    { label: "Powerplay (0-6)", start: 0, end: 6 },
    { label: "Middle (6-15)", start: 6, end: 15 },
    { label: "Death (15-20)", start: 15, end: 20 },
  ];
  const phaseStats = (inn: InningsState) =>
    phases.map((p) => {
      const runs = inn.runsPerOver
        .slice(p.start, p.end)
        .reduce((a, b) => a + b, 0);
      const wkts = inn.wicketsPerOver
        .slice(p.start, p.end)
        .reduce((a, b) => a + b, 0);
      return { ...p, runs, wkts };
    });

  const first = phaseStats(state.firstInnings);
  const second = state.secondInnings ? phaseStats(state.secondInnings) : null;

  return (
    <div className="w-full h-full flex flex-col justify-around px-6 py-4 gap-3">
      <div className="text-xs uppercase tracking-widest text-slate-500 text-center">
        Phase comparison
      </div>
      {phases.map((p, i) => (
        <div key={p.label} className="space-y-1">
          <div className="flex justify-between text-sm text-slate-300">
            <span>{p.label}</span>
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-xs text-sky-400 w-28">
              {state.firstInnings.team.split(" ").map(w => w[0]).join("")}:{" "}
              <span className="text-slate-200 tabular">
                {first[i].runs}/{first[i].wkts}
              </span>
            </div>
            <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-sky-500"
                style={{ width: `${Math.min(100, (first[i].runs / 80) * 100)}%` }}
              />
            </div>
          </div>
          {second && (
            <div className="flex gap-2 items-center">
              <div className="text-xs text-amber-400 w-28">
                {state.secondInnings!.team.split(" ").map(w => w[0]).join("")}:{" "}
                <span className="text-slate-200 tabular">
                  {second[i].runs}/{second[i].wkts}
                </span>
              </div>
              <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${Math.min(100, (second[i].runs / 80) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HeadToHead({ state }: { state: MatchState }) {
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;
  const top = Object.values(inn.batters)
    .filter((b) => b.balls > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 2);
  if (top.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        Head-to-head — waiting for second batter
      </div>
    );
  }
  return (
    <div className="w-full h-full px-6 py-4 grid grid-cols-2 gap-6">
      {top.map((b) => (
        <div key={b.name} className="bg-slate-900/50 rounded-lg p-4 text-center">
          <div className="text-sm text-slate-400 truncate">{b.name}</div>
          <div className="text-5xl font-black tabular">{b.runs}</div>
          <div className="text-sm text-slate-400 tabular">
            ({b.balls}) SR {b.strikeRate.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500 tabular mt-1">
            4s {b.fours} · 6s {b.sixes}
          </div>
        </div>
      ))}
    </div>
  );
}
