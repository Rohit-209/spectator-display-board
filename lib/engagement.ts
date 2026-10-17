import { getDb } from "./db";

export type EngagementEvent =
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "page_view";
      source: "qr" | "direct";
      ua?: string;
    }
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "tab_change";
      tab: string;
    }
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "panel_focus";
      panel: string;
    }
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "panel_tap";
      panel: string;
    }
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "heartbeat";
    }
  | {
      ts: number;
      sessionId: string;
      matchId: string | null;
      kind: "session_end";
      dwellMs: number;
    };

export function appendEvent(event: EngagementEvent): void {
  try {
    const db = getDb();
    // Variant-specific fields go into payload JSON; common fields are columns.
    const { ts, sessionId, matchId, kind, ...rest } = event as EngagementEvent &
      Record<string, unknown>;
    db.prepare(
      `INSERT INTO engagement_events (ts, session_id, match_id, kind, payload)
       VALUES (?,?,?,?,?)`,
    ).run(ts, sessionId, matchId, kind, JSON.stringify(rest));
  } catch (err) {
    console.error("engagement append failed", err);
  }
}

export type EngagementSummary = {
  totalEvents: number;
  sessions: number;
  qrSessions: number;
  directSessions: number;
  tabChanges: Record<string, number>;
  panelFocus: Record<string, number>;
  panelTaps: Record<string, number>;
  dwellMedianMs: number | null;
  dwellP95Ms: number | null;
};

function percentile(sortedAsc: number[], p: number): number | null {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.floor((p / 100) * sortedAsc.length));
  return sortedAsc[idx];
}

export function readSummary(): EngagementSummary {
  const db = getDb();
  const total =
    (db.prepare("SELECT COUNT(*) AS n FROM engagement_events").get() as {
      n: number;
    }).n ?? 0;

  const sources = db
    .prepare(
      `SELECT session_id, payload FROM engagement_events WHERE kind = 'page_view'`,
    )
    .all() as Array<{ session_id: string; payload: string }>;
  const sessionSources = new Map<string, "qr" | "direct">();
  for (const r of sources) {
    try {
      const p = JSON.parse(r.payload);
      sessionSources.set(r.session_id, p.source === "qr" ? "qr" : "direct");
    } catch {
      sessionSources.set(r.session_id, "direct");
    }
  }
  const sessions = sessionSources.size;
  let qrSessions = 0;
  let directSessions = 0;
  for (const s of sessionSources.values()) {
    if (s === "qr") qrSessions += 1;
    else directSessions += 1;
  }

  const tabChanges: Record<string, number> = {};
  for (const r of db
    .prepare(
      `SELECT payload, COUNT(*) AS n FROM engagement_events
         WHERE kind = 'tab_change' GROUP BY payload`,
    )
    .all() as Array<{ payload: string; n: number }>) {
    try {
      tabChanges[JSON.parse(r.payload).tab] = r.n;
    } catch {}
  }

  const panelFocus: Record<string, number> = {};
  for (const r of db
    .prepare(
      `SELECT payload, COUNT(*) AS n FROM engagement_events
         WHERE kind = 'panel_focus' GROUP BY payload`,
    )
    .all() as Array<{ payload: string; n: number }>) {
    try {
      panelFocus[JSON.parse(r.payload).panel] = r.n;
    } catch {}
  }

  const panelTaps: Record<string, number> = {};
  for (const r of db
    .prepare(
      `SELECT payload, COUNT(*) AS n FROM engagement_events
         WHERE kind = 'panel_tap' GROUP BY payload`,
    )
    .all() as Array<{ payload: string; n: number }>) {
    try {
      panelTaps[JSON.parse(r.payload).panel] = r.n;
    } catch {}
  }

  const sessionDwell = new Map<string, number>();
  for (const r of db
    .prepare(
      `SELECT session_id, payload FROM engagement_events WHERE kind = 'session_end'`,
    )
    .all() as Array<{ session_id: string; payload: string }>) {
    try {
      const d = JSON.parse(r.payload).dwellMs;
      if (typeof d === "number") {
        sessionDwell.set(r.session_id, Math.max(sessionDwell.get(r.session_id) ?? 0, d));
      }
    } catch {}
  }
  const dwells = [...sessionDwell.values()].filter((d) => d > 0).sort((a, b) => a - b);

  return {
    totalEvents: total,
    sessions,
    qrSessions,
    directSessions,
    tabChanges,
    panelFocus,
    panelTaps,
    dwellMedianMs: percentile(dwells, 50),
    dwellP95Ms: percentile(dwells, 95),
  };
}

export function readRawJsonl(): string {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ts, session_id, match_id, kind, payload FROM engagement_events ORDER BY id ASC`,
    )
    .all() as Array<Record<string, unknown>>;
  return rows
    .map((r) =>
      JSON.stringify({
        ts: r.ts,
        sessionId: r.session_id,
        matchId: r.match_id,
        kind: r.kind,
        ...JSON.parse(String(r.payload)),
      }),
    )
    .join("\n");
}
