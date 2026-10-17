"use client";
import { useEffect, useState } from "react";
import type { InsightMessage } from "@/lib/types";

export function ZoneE({ insight }: { insight: InsightMessage | null }) {
  const [visible, setVisible] = useState<InsightMessage | null>(insight);
  useEffect(() => {
    if (!insight) return;
    setVisible(insight);
  }, [insight]);

  return (
    <div className="col-span-12 bg-gradient-to-r from-emerald-900/40 via-emerald-800/40 to-emerald-900/40 border-t-4 border-accent rounded-b-xl px-8 py-5 flex items-center gap-6">
      <div className="text-sm uppercase tracking-widest text-emerald-300 shrink-0">
        AI Insight
      </div>
      <div className="text-4xl font-semibold flex-1 min-h-[3rem] leading-tight">
        {visible ? (
          <span
            key={visible.id}
            style={{ animation: "fadein 600ms ease-out" }}
          >
            {visible.text}
          </span>
        ) : (
          <span className="text-slate-500 italic text-2xl">
            Awaiting trigger…
          </span>
        )}
      </div>
      {visible && (
        <div className="text-xs text-emerald-300/70 shrink-0">
          {visible.source === "llm" ? "LLM" : "Template"} · {visible.trigger}
        </div>
      )}
      <style>{`@keyframes fadein { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: none;} }`}</style>
    </div>
  );
}
