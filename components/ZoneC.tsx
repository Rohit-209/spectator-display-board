"use client";
import { useEffect, useState } from "react";
import type { MatchState } from "@/lib/types";
import { WormChart, Manhattan, PhaseCompare, HeadToHead } from "./charts";

const PANELS = ["worm", "manhattan", "phase", "head"] as const;
type Panel = (typeof PANELS)[number];

const ROTATE_MS = 12_000;

export function ZoneC({ state }: { state: MatchState }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % PANELS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);
  const panel: Panel = PANELS[idx];
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;

  const label: Record<Panel, string> = {
    worm: "Worm chart",
    manhattan: `Manhattan — ${inn.team}`,
    phase: "Phase comparison",
    head: "Top scorers",
  };

  return (
    <div className="col-span-6 bg-panel rounded-xl relative overflow-hidden min-h-[380px]">
      <div className="absolute top-3 left-5 text-xs uppercase tracking-widest text-slate-500">
        {label[panel]}
      </div>
      <div className="absolute top-3 right-5 flex gap-1">
        {PANELS.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i === idx ? "bg-accent" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      <div className="absolute inset-0 top-10">
        {panel === "worm" && <WormChart state={state} />}
        {panel === "manhattan" && <Manhattan innings={inn} />}
        {panel === "phase" && <PhaseCompare state={state} />}
        {panel === "head" && <HeadToHead state={state} />}
      </div>
    </div>
  );
}
