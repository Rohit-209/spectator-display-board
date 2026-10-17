"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStream } from "@/lib/use-stream";
import { useEngagement } from "@/lib/use-engagement";
import { WormChart, Manhattan, PhaseCompare, HeadToHead } from "@/components/charts";
import { useCompare } from "@/lib/use-compare";
import type { BatterComparison } from "@/lib/compare";
import type { InningsState, MatchState } from "@/lib/types";

const TABS = ["score", "batting", "bowling", "charts"] as const;
type Tab = (typeof TABS)[number];

export default function CompanionPage() {
  return (
    <Suspense fallback={null}>
      <Companion />
    </Suspense>
  );
}

function Companion() {
  const { state, insight } = useStream();
  const params = useSearchParams();
  const source = params.get("src") === "qr" ? "qr" : "direct";
  const matchId = state?.meta.matchId ?? null;
  const { emit } = useEngagement({ matchId, source });
  const [tab, setTab] = useState<Tab>("score");

  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 text-center text-slate-400">
        Waiting for match…
      </main>
    );
  }

  const liveInn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;

  return (
    <main className="min-h-screen bg-[#0b1220] text-slate-100">
      <div className="max-w-[480px] mx-auto flex flex-col gap-3 p-3 pb-24">
        <header className="rounded-xl bg-panel p-4">
          <div className="text-xs uppercase tracking-widest text-slate-500">
            {state.meta.teams[0]} vs {state.meta.teams[1]} · {state.meta.date ?? ""}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div>
              <div className="text-xl font-black">
                {liveInn.team} {liveInn.runs}/{liveInn.wickets}
              </div>
              <div className="text-sm text-slate-400">
                ({liveInn.overs}) · {state.meta.totalOvers} overs
              </div>
            </div>
            <div className="text-right">
              {state.target && (
                <div className="text-xs text-slate-400">target {state.target}</div>
              )}
              {state.winProbability && (
                <div className="text-sm font-semibold text-emerald-400">
                  {Math.round(state.winProbability.battingTeam * 100)}% win
                </div>
              )}
              {state.projectedScore && !state.target && (
                <div className="text-sm text-sky-400">
                  proj {state.projectedScore}
                </div>
              )}
            </div>
          </div>
          {insight && (
            <div className="mt-3 border-t border-slate-800 pt-2 text-sm text-slate-300">
              {insight.text}
            </div>
          )}
        </header>

        <nav
          className="sticky top-0 z-10 bg-[#0b1220]/90 backdrop-blur rounded-xl flex p-1 text-sm"
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={t === tab}
              onClick={() => {
                setTab(t);
                emit({ kind: "tab_change", tab: t });
              }}
              className={`flex-1 rounded-lg py-2 capitalize ${
                t === tab
                  ? "bg-accent text-slate-900 font-semibold"
                  : "text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "score" && (
          <ScoreTab state={state} onFocus={(p) => emit({ kind: "panel_focus", panel: p })} />
        )}
        {tab === "batting" && (
          <BattingTab state={state} onFocus={(p) => emit({ kind: "panel_focus", panel: p })} />
        )}
        {tab === "bowling" && (
          <BowlingTab state={state} onFocus={(p) => emit({ kind: "panel_focus", panel: p })} />
        )}
        {tab === "charts" && (
          <ChartsTab state={state} onFocus={(p) => emit({ kind: "panel_focus", panel: p })} />
        )}
      </div>
    </main>
  );
}

function Section({
  panel,
  title,
  onFocus,
  children,
}: {
  panel: string;
  title: string;
  onFocus: (p: string) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            onFocus(panel);
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [panel, onFocus]);
  return (
    <section ref={ref} className="rounded-xl bg-panel p-4">
      <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ScoreTab({ state, onFocus }: { state: MatchState; onFocus: (p: string) => void }) {
  const inns: InningsState[] = state.secondInnings
    ? [state.firstInnings, state.secondInnings]
    : [state.firstInnings];
  return (
    <>
      {inns.map((inn, i) => (
        <Section
          key={i}
          panel={`score-innings-${i + 1}`}
          title={`${i === 0 ? "1st" : "2nd"} innings · ${inn.team}`}
          onFocus={onFocus}
        >
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-2xl font-black">
              {inn.runs}/{inn.wickets}
            </div>
            <div className="text-sm text-slate-400">({inn.overs})</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
            <Stat label="extras" value={String(inn.extras.total)} />
            <Stat label="wides" value={String(inn.extras.wides)} />
            <Stat label="no-balls" value={String(inn.extras.noballs)} />
            <Stat label="byes" value={String(inn.extras.byes)} />
            <Stat label="leg-byes" value={String(inn.extras.legbyes)} />
            <Stat label="partnership" value={`${inn.partnership.runs} (${inn.partnership.balls})`} />
          </div>
        </Section>
      ))}
    </>
  );
}

function BattingTab({ state, onFocus }: { state: MatchState; onFocus: (p: string) => void }) {
  const inns: InningsState[] = state.secondInnings
    ? [state.firstInnings, state.secondInnings]
    : [state.firstInnings];
  const allBatters = inns.flatMap((inn) => inn.batterOrder);
  const compare = useCompare(state.meta.matchId, allBatters);
  return (
    <>
      {inns.map((inn, i) => (
        <Section
          key={i}
          panel={`batting-innings-${i + 1}`}
          title={`${inn.team} batting`}
          onFocus={onFocus}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left py-1">Batter</th>
                <th className="text-right">R</th>
                <th className="text-right">B</th>
                <th className="text-right">4s</th>
                <th className="text-right">6s</th>
                <th className="text-right">SR</th>
              </tr>
            </thead>
            <tbody>
              {inn.batterOrder.map((n) => {
                const b = inn.batters[n];
                const live = inn.currentStriker === n || inn.currentNonStriker === n;
                const cmp = compare[n];
                return (
                  <tr
                    key={n}
                    className={`border-b border-slate-900 ${
                      live ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    <td className="py-1.5">
                      <div className="font-semibold">
                        {n}
                        {inn.currentStriker === n && <span className="text-accent"> *</span>}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-600">
                        {b.isOut
                          ? b.outDescription
                          : live
                            ? "not out"
                            : ""}
                      </div>
                      <CompareRow cmp={cmp} liveSR={b.strikeRate} />
                    </td>
                    <td className="text-right tabular-nums">{b.runs}</td>
                    <td className="text-right tabular-nums">{b.balls}</td>
                    <td className="text-right tabular-nums">{b.fours}</td>
                    <td className="text-right tabular-nums">{b.sixes}</td>
                    <td className="text-right tabular-nums">
                      {b.strikeRate ? b.strikeRate.toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] text-slate-600">
            Season / career strike rate from Cricsheet IPL history for context.
          </p>
        </Section>
      ))}
    </>
  );
}

function CompareRow({ cmp, liveSR }: { cmp: BatterComparison | undefined; liveSR: number }) {
  if (!cmp) return null;
  const season = cmp.seasonStats;
  const career = cmp.careerStats;
  if (!season && !career) return null;
  return (
    <div className="text-[10px] text-slate-500 flex gap-3 pt-0.5">
      {season && (
        <span>
          {cmp.season ?? "season"}: SR{" "}
          <span className={deltaColor(liveSR, season.strikeRate)}>
            {season.strikeRate.toFixed(1)}
          </span>{" "}
          over {season.innings} inn
        </span>
      )}
      {career && (
        <span>
          career: SR{" "}
          <span className={deltaColor(liveSR, career.strikeRate)}>
            {career.strikeRate.toFixed(1)}
          </span>{" "}
          · HS {career.highest}
        </span>
      )}
    </div>
  );
}

function deltaColor(live: number, baseline: number): string {
  if (!baseline || !live) return "text-slate-500";
  if (live >= baseline * 1.15) return "text-emerald-400";
  if (live <= baseline * 0.85) return "text-rose-400";
  return "text-slate-400";
}

function BowlingTab({ state, onFocus }: { state: MatchState; onFocus: (p: string) => void }) {
  const inns: InningsState[] = state.secondInnings
    ? [state.firstInnings, state.secondInnings]
    : [state.firstInnings];
  return (
    <>
      {inns.map((inn, i) => (
        <Section
          key={i}
          panel={`bowling-innings-${i + 1}`}
          title={`vs ${inn.team}`}
          onFocus={onFocus}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left py-1">Bowler</th>
                <th className="text-right">O</th>
                <th className="text-right">R</th>
                <th className="text-right">W</th>
                <th className="text-right">Econ</th>
                <th className="text-right">Dots</th>
              </tr>
            </thead>
            <tbody>
              {inn.bowlerOrder.map((n) => {
                const b = inn.bowlers[n];
                return (
                  <tr key={n} className="border-b border-slate-900">
                    <td className="py-1.5 font-semibold">{n}</td>
                    <td className="text-right tabular-nums">{b.overs}</td>
                    <td className="text-right tabular-nums">{b.runs}</td>
                    <td className="text-right tabular-nums">{b.wickets}</td>
                    <td className="text-right tabular-nums">
                      {b.economy ? b.economy.toFixed(2) : "—"}
                    </td>
                    <td className="text-right tabular-nums">{b.dots}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      ))}
    </>
  );
}

function ChartsTab({ state, onFocus }: { state: MatchState; onFocus: (p: string) => void }) {
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;
  return (
    <>
      <Section panel="chart-worm" title="Worm" onFocus={onFocus}>
        <div className="h-56">
          <WormChart state={state} />
        </div>
      </Section>
      <Section panel="chart-manhattan" title={`Manhattan — ${inn.team}`} onFocus={onFocus}>
        <div className="h-56">
          <Manhattan innings={inn} />
        </div>
      </Section>
      <Section panel="chart-phase" title="Phase comparison" onFocus={onFocus}>
        <div className="h-56">
          <PhaseCompare state={state} />
        </div>
      </Section>
      <Section panel="chart-top-scorers" title="Top scorers" onFocus={onFocus}>
        <div className="h-56">
          <HeadToHead state={state} />
        </div>
      </Section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-900/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="text-sm text-slate-100 tabular-nums">{value}</div>
    </div>
  );
}

