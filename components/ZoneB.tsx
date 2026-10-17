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
    <div className="col-span-3 bg-panel rounded-xl p-5 flex flex-col gap-5 min-h-[380px]">
      <SectionTitle>Batters</SectionTitle>
      <BatterLine batter={striker} isStriker />
      <BatterLine batter={nonStriker} />
      <div className="border-t border-slate-700/70 my-1" />
      <SectionTitle>Bowler</SectionTitle>
      {bowler ? (
        <div className="space-y-1">
          <div className="text-2xl font-semibold truncate">{bowler.name}</div>
          <div className="text-xl text-slate-300 tabular font-semibold">
            {bowler.wickets}/{bowler.runs}
            <span className="text-slate-500 text-base ml-2">
              ({bowler.overs} ov)
            </span>
          </div>
        </div>
      ) : (
        <div className="text-slate-500">—</div>
      )}
      <div className="border-t border-slate-700/70 my-1" />
      <SectionTitle>Partnership</SectionTitle>
      <div className="text-2xl font-semibold tabular">
        {inn.partnership.runs}
        <span className="text-slate-400 text-lg"> ({inn.partnership.balls})</span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm uppercase tracking-widest text-slate-500">
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
        <span className="text-2xl font-semibold truncate">
          {b.name} {isStriker && <span className="text-accent-2">*</span>}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mt-1">
        <span className="text-3xl tabular font-black">{b.runs}</span>
        <span className="text-xl text-slate-400 tabular">({b.balls})</span>
        <span className="text-lg text-slate-400 tabular ml-auto">
          SR {b.strikeRate.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
