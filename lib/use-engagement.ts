"use client";
import { useEffect, useRef, useCallback } from "react";
import type { EngagementEvent } from "./engagement";

// Distributes Omit across the union so each variant keeps its own payload.
type EmitPayload = EngagementEvent extends infer E
  ? E extends unknown
    ? Omit<E, "ts" | "sessionId" | "matchId">
    : never
  : never;

const SESSION_KEY = "sdb-session-id";

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `s_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

function post(event: EngagementEvent, useBeacon = false): void {
  const body = JSON.stringify(event);
  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

type Opts = {
  matchId: string | null;
  source: "qr" | "direct";
};

export function useEngagement({ matchId, source }: Opts) {
  const sid = useRef<string>("");
  const openedAt = useRef<number>(0);
  const visibleMs = useRef<number>(0);
  const visibleSince = useRef<number | null>(null);

  const emit = useCallback(
    (partial: EmitPayload) => {
      const event = {
        ts: Date.now(),
        sessionId: sid.current,
        matchId,
        ...partial,
      } as EngagementEvent;
      post(event);
    },
    [matchId],
  );

  useEffect(() => {
    sid.current = sessionId();
    openedAt.current = Date.now();
    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;
    post({
      ts: Date.now(),
      sessionId: sid.current,
      matchId,
      kind: "page_view",
      source,
      ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });

    const heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") {
        post({
          ts: Date.now(),
          sessionId: sid.current,
          matchId,
          kind: "heartbeat",
        });
      }
    }, 10_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        visibleSince.current = Date.now();
      } else if (visibleSince.current) {
        visibleMs.current += Date.now() - visibleSince.current;
        visibleSince.current = null;
      }
    };

    const endSession = () => {
      if (visibleSince.current) {
        visibleMs.current += Date.now() - visibleSince.current;
        visibleSince.current = null;
      }
      post(
        {
          ts: Date.now(),
          sessionId: sid.current,
          matchId,
          kind: "session_end",
          dwellMs: visibleMs.current,
        },
        true,
      );
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", endSession);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", endSession);
      endSession();
    };
  }, [matchId, source]);

  return { emit };
}
