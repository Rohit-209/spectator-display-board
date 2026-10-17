"use client";
import { useEffect, useState } from "react";
import type { BatterComparison } from "./compare";

export function useCompare(matchId: string | null, batters: string[]) {
  const [data, setData] = useState<Record<string, BatterComparison>>({});
  const key = JSON.stringify({ matchId, batters });

  useEffect(() => {
    if (!matchId || batters.length === 0) return;
    let cancelled = false;
    const url = new URL("/api/compare", window.location.origin);
    url.searchParams.set("matchId", matchId);
    for (const b of batters) url.searchParams.append("batter", b);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d: { comparisons: BatterComparison[] }) => {
        if (cancelled) return;
        const next: Record<string, BatterComparison> = {};
        for (const c of d.comparisons) next[c.batter] = c;
        setData(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
