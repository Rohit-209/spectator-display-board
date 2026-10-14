"use client";
import { useEffect, useRef, useState } from "react";
import type { InsightMessage, MatchState, ReplayStatus, StreamFrame } from "./types";

export function useStream() {
  const [state, setState] = useState<MatchState | null>(null);
  const [status, setStatus] = useState<ReplayStatus | null>(null);
  const [insight, setInsight] = useState<InsightMessage | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
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
        const emittedAt = frame.state.lastEvent?.emittedAt;
        if (emittedAt) setLatencyMs(Date.now() - emittedAt);
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

  return { state, status, insight, latencyMs };
}
