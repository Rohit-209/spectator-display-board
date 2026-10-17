"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { InsightMessage, MatchState, ReplayStatus, StreamFrame } from "./types";

export type LatencySample = {
  matchId: string;
  innings: 1 | 2;
  over: number;
  ballInOver: number;
  globalBallIndex: number;
  emittedAt: number;
  renderedAt: number;
  latencyMs: number;
};

export type LatencyStats = {
  n: number;
  p50: number | null;
  p95: number | null;
  mean: number | null;
  max: number | null;
};

const MAX_SAMPLES = 5000;

function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

export function useStream() {
  const [state, setState] = useState<MatchState | null>(null);
  const [status, setStatus] = useState<ReplayStatus | null>(null);
  const [insight, setInsight] = useState<InsightMessage | null>(null);
  const [samples, setSamples] = useState<LatencySample[]>([]);
  const lastBallRef = useRef<number>(-1);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    esRef.current = es;
    es.onmessage = (ev) => {
      const frame = JSON.parse(ev.data) as StreamFrame & { renderedAt?: number };
      if (frame.kind === "state") {
        setState(frame.state);
        setStatus(frame.status);
        if (frame.state.insight) setInsight(frame.state.insight);
        const lastEvent = frame.state.lastEvent;
        if (lastEvent?.emittedAt && lastEvent.globalBallIndex !== lastBallRef.current) {
          lastBallRef.current = lastEvent.globalBallIndex;
          const renderedAt = Date.now();
          const sample: LatencySample = {
            matchId: lastEvent.matchId,
            innings: lastEvent.innings,
            over: lastEvent.over,
            ballInOver: lastEvent.ballInOver,
            globalBallIndex: lastEvent.globalBallIndex,
            emittedAt: lastEvent.emittedAt,
            renderedAt,
            latencyMs: renderedAt - lastEvent.emittedAt,
          };
          setSamples((prev) =>
            prev.length >= MAX_SAMPLES
              ? [...prev.slice(prev.length - MAX_SAMPLES + 1), sample]
              : [...prev, sample],
          );
        }
      } else if (frame.kind === "status") {
        setStatus(frame.status);
      } else if (frame.kind === "insight") {
        setInsight(frame.insight);
      }
    };
    es.onerror = () => {
      // Browser auto-reconnects on EventSource.
    };
    return () => {
      es.close();
    };
  }, []);

  const stats: LatencyStats = useMemo(() => {
    if (samples.length === 0) return { n: 0, p50: null, p95: null, mean: null, max: null };
    const vals = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      n: vals.length,
      p50: percentile(vals, 50),
      p95: percentile(vals, 95),
      mean: Math.round(mean),
      max: vals[vals.length - 1],
    };
  }, [samples]);

  const latencyMs = samples.length > 0 ? samples[samples.length - 1].latencyMs : null;

  return { state, status, insight, latencyMs, samples, stats };
}

export function samplesToCsv(samples: LatencySample[]): string {
  const header = "matchId,innings,over,ballInOver,globalBallIndex,emittedAt,renderedAt,latencyMs";
  const rows = samples.map(
    (s) =>
      `${s.matchId},${s.innings},${s.over},${s.ballInOver},${s.globalBallIndex},${s.emittedAt},${s.renderedAt},${s.latencyMs}`,
  );
  return [header, ...rows].join("\n");
}
