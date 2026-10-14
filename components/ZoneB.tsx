import type { BatterCard, MatchState } from "@/lib/types";

export function ZoneB({ state }: { state: MatchState }) {
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;
  const striker = inn.currentStriker ? inn.batters[inn.currentStriker] : null;
  const nonStriker = inn.currentNonStriker
    ? inn.batters[inn.currentNonStriker]
    : null;
  const bowler = inn.currentBowler ? inn.bowlers[inn.currentBowler] : null;

  return (
    <div className="col-span-3 bg-panel rounded-xl p-5 flex flex-col gap-4 min-h-[380px]">
      <SectionTitle>Batters</SectionTitle>
      <BatterLine batter={striker} isStriker />
      <BatterLine batter={nonStriker} />
      <div className="border-t border-slate-700/70 my-2" />
      <SectionTitle>Bowler</SectionTitle>
      {bowler && (
        <div className="space-y-1">
          <div className="text-xl font-semibold truncate">{bowler.name}</div>
          <div className="text-sm text-slate-400 tabular">
            {bowler.overs}-0-{bowler.runs}-{bowler.wickets}
            <span className="ml-3">Econ {bowler.economy.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div className="border-t border-slate-700/70 my-2" />
      <SectionTitle>Partnership</SectionTitle>
      <div className="text-xl font-semibold tabular">
        {inn.partnership.runs}{" "}
        <span className="text-slate-400 text-base">({inn.partnership.balls})</span>
      </div>
      <SectionTitle>Extras</SectionTitle>
      <div className="text-sm text-slate-400 tabular">
        {inn.extras.total} (wd {inn.extras.wides}, nb {inn.extras.noballs}, b {inn.extras.byes}, lb {inn.extras.legbyes})
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-widest text-slate-500">
      {children}
    </div>
  );
}

function BatterLine({
  batter,
  isStriker = false,
}: {
  batter: BatterCard | null;
  isStriker?: boolean;
}) {
  if (!batter) return <div className="text-slate-500">—</div>;
  const b = batter;
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold truncate">
          {b.name} {isStriker && <span className="text-accent-2">*</span>}
        </span>
      </div>
      <div className="text-2xl tabular font-black">
        {b.runs} <span className="text-slate-400 text-lg">({b.balls})</span>
      </div>
      <div className="text-xs text-slate-400 tabular">
        SR {b.strikeRate.toFixed(1)} &nbsp; 4s {b.fours} &nbsp; 6s {b.sixes}
      </div>
    </div>
  );
}
