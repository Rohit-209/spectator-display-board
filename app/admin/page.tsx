"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStream, samplesToCsv } from "@/lib/use-stream";

type MatchSummary = {
  matchId: string;
  teams: [string, string];
  date: string | null;
  city: string | null;
};

type AuditSummary = {
  total: number;
  llmAttempted: number;
  llmReturnedText: number;
  llmValidatorPassed: number;
  llmValidatorFailed: number;
  llmErrors: number;
  templateFallbacks: number;
  rejectionRate: number | null;
  byTrigger: Record<string, number>;
};

type EngagementSummary = {
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

async function sendAction(body: Record<string, unknown>) {
  await fetch("/api/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function AdminPage() {
  const { state, status, insight, latencyMs, samples, stats } = useStream();
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [seekOverStr, setSeekOverStr] = useState("");
  const [audit, setAudit] = useState<AuditSummary | null>(null);
  const [engagement, setEngagement] = useState<EngagementSummary | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = () => {
      fetch("/api/insight-audit")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setAudit(d);
        })
        .catch(() => {});
      fetch("/api/engagement")
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setEngagement(d);
        })
        .catch(() => {});
    };
    fetchAll();
    const t = setInterval(fetchAll, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-black">Replay Admin</h1>
          <Link href="/" className="underline text-slate-400">
            Open board →
          </Link>
        </header>

        <section className="bg-panel rounded-xl p-6">
          <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-4">
            Match
          </h2>
          {!matches && <div className="text-slate-500">Loading matches…</div>}
          {matches && (
            <ul className="divide-y divide-slate-800">
              {matches.map((m) => (
                <li
                  key={m.matchId}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">
                      {m.teams[0]} vs {m.teams[1]}
                    </div>
                    <div className="text-xs text-slate-500">
                      {m.date ?? "—"} · {m.city ?? "—"} · #{m.matchId}
                    </div>
                  </div>
                  <button
                    onClick={() => sendAction({ action: "load", matchId: m.matchId })}
                    className={`px-3 py-1.5 rounded text-sm font-semibold ${
                      status?.matchId === m.matchId
                        ? "bg-accent text-slate-900"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    {status?.matchId === m.matchId ? "Loaded" : "Load"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-panel rounded-xl p-6 space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-slate-400">
            Controls
          </h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => sendAction({ action: "play" })}
              disabled={!status?.loaded || status.playing}
              className="px-4 py-2 rounded bg-accent text-slate-900 font-semibold disabled:opacity-30"
            >
              Play
            </button>
            <button
              onClick={() => sendAction({ action: "pause" })}
              disabled={!status?.playing}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
            >
              Pause
            </button>
            <button
              onClick={() => sendAction({ action: "restart" })}
              disabled={!status?.loaded}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
            >
              Restart
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-400">Speed</span>
              {[1, 2, 5, 10, 20, 50].map((s) => (
                <button
                  key={s}
                  onClick={() => sendAction({ action: "speed", speed: s })}
                  className={`px-3 py-1 rounded text-sm ${
                    status?.speed === s
                      ? "bg-accent text-slate-900 font-semibold"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <label className="text-xs text-slate-400">
              Seek to over (format: 1.6 = 1st innings, over 6)
            </label>
            <input
              value={seekOverStr}
              onChange={(e) => setSeekOverStr(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm w-24"
              placeholder="1.6"
            />
            <button
              onClick={() => {
                const [innStr, overStr] = seekOverStr.split(".");
                const innings = Number(innStr) === 2 ? 2 : 1;
                const over = Number(overStr) || 0;
                sendAction({ action: "seekOver", innings, over });
              }}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Seek
            </button>
          </div>
        </section>

        <section className="bg-panel rounded-xl p-6">
          <h2 className="text-sm uppercase tracking-widest text-slate-400 mb-3">
            Live state
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat
              label="Status"
              value={
                status?.loaded
                  ? status.playing
                    ? "playing"
                    : status.completed
                      ? "complete"
                      : "paused"
                  : "no match"
              }
            />
            <Stat label="Ball" value={`${status?.cursor ?? 0}/${status?.total ?? 0}`} />
            <Stat label="Speed" value={`${status?.speed ?? "—"}x`} />
            <Stat label="Latency" value={latencyMs !== null ? `${latencyMs} ms` : "—"} />
            {state && (
              <>
                <Stat
                  label="Score"
                  value={`${
                    (state.currentInnings === 1
                      ? state.firstInnings
                      : state.secondInnings!
                    ).runs
                  }/${
                    (state.currentInnings === 1
                      ? state.firstInnings
                      : state.secondInnings!
                    ).wickets
                  } (${
                    (state.currentInnings === 1
                      ? state.firstInnings
                      : state.secondInnings!
                    ).overs
                  })`}
                />
                <Stat
                  label="Win prob (bat)"
                  value={
                    state.winProbability
                      ? `${Math.round(state.winProbability.battingTeam * 100)}%`
                      : "—"
                  }
                />
              </>
            )}
          </div>
          {insight && (
            <div className="mt-4 p-3 rounded bg-emerald-900/30 border border-emerald-700/50 text-sm">
              <span className="text-emerald-400 mr-2">[{insight.source}]</span>
              {insight.text}
            </div>
          )}
        </section>

        <section className="bg-panel rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-slate-400">
              End-to-end latency (plan §5.1)
            </h2>
            <button
              onClick={() => downloadCsv(samples, status?.matchId ?? "match")}
              disabled={samples.length === 0}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold disabled:opacity-30"
            >
              Download CSV ({samples.length})
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <Stat label="n samples" value={String(stats.n)} />
            <Stat
              label="p50"
              value={stats.p50 !== null ? `${stats.p50} ms` : "—"}
            />
            <Stat
              label="p95"
              value={stats.p95 !== null ? `${stats.p95} ms` : "—"}
            />
            <Stat
              label="max"
              value={stats.max !== null ? `${stats.max} ms` : "—"}
            />
          </div>
          <div className="text-xs text-slate-500">
            Targets: median &lt; 300 ms, p95 &lt; 1 s. Live sample: {latencyMs ?? "—"} ms.
          </div>
        </section>

        <section className="bg-panel rounded-xl p-6 space-y-3">
          <h2 className="text-sm uppercase tracking-widest text-slate-400">
            Insight audit (plan §5.1)
          </h2>
          {!audit && <div className="text-slate-500 text-sm">loading…</div>}
          {audit && (
            <>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Stat label="triggers fired" value={String(audit.total)} />
                <Stat
                  label="LLM attempted"
                  value={String(audit.llmAttempted)}
                />
                <Stat
                  label="LLM returned"
                  value={String(audit.llmReturnedText)}
                />
                <Stat
                  label="template fallbacks"
                  value={String(audit.templateFallbacks)}
                />
                <Stat
                  label="validator passed"
                  value={String(audit.llmValidatorPassed)}
                />
                <Stat
                  label="validator failed"
                  value={String(audit.llmValidatorFailed)}
                />
                <Stat label="LLM errors" value={String(audit.llmErrors)} />
                <Stat
                  label="rejection rate"
                  value={
                    audit.rejectionRate !== null
                      ? `${(audit.rejectionRate * 100).toFixed(1)}%`
                      : "—"
                  }
                />
              </div>
              {Object.keys(audit.byTrigger).length > 0 && (
                <div className="text-xs text-slate-500">
                  By trigger:{" "}
                  {Object.entries(audit.byTrigger)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ")}
                </div>
              )}
              <div className="text-xs text-slate-500">
                Audit file: <code>data/insight-audit.jsonl</code> · validator-rejected LLM
                output is replaced by a template, so what reaches the board is always
                numerically correct.
              </div>
            </>
          )}
        </section>

        <section className="bg-panel rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-slate-400">
              Companion engagement (plan §5.3)
            </h2>
            <a
              href="/api/engagement?format=jsonl"
              download
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
            >
              Download JSONL
            </a>
          </div>
          {!engagement && (
            <div className="text-slate-500 text-sm">loading…</div>
          )}
          {engagement && (
            <>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <Stat label="sessions" value={String(engagement.sessions)} />
                <Stat label="QR scans" value={String(engagement.qrSessions)} />
                <Stat label="direct" value={String(engagement.directSessions)} />
                <Stat
                  label="events"
                  value={String(engagement.totalEvents)}
                />
                <Stat
                  label="median dwell"
                  value={
                    engagement.dwellMedianMs !== null
                      ? `${Math.round(engagement.dwellMedianMs / 1000)}s`
                      : "—"
                  }
                />
                <Stat
                  label="p95 dwell"
                  value={
                    engagement.dwellP95Ms !== null
                      ? `${Math.round(engagement.dwellP95Ms / 1000)}s`
                      : "—"
                  }
                />
                <Stat
                  label="tab changes"
                  value={String(
                    Object.values(engagement.tabChanges).reduce((a, b) => a + b, 0),
                  )}
                />
                <Stat
                  label="panel focuses"
                  value={String(
                    Object.values(engagement.panelFocus).reduce((a, b) => a + b, 0),
                  )}
                />
              </div>
              {Object.keys(engagement.panelFocus).length > 0 && (
                <div className="text-xs text-slate-500">
                  Panels:{" "}
                  {Object.entries(engagement.panelFocus)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ")}
                </div>
              )}
              {Object.keys(engagement.tabChanges).length > 0 && (
                <div className="text-xs text-slate-500">
                  Tabs:{" "}
                  {Object.entries(engagement.tabChanges)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ")}
                </div>
              )}
              <div className="text-xs text-slate-500">
                Log file: <code>data/engagement.jsonl</code>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function downloadCsv(
  samples: ReturnType<typeof useStream>["samples"],
  matchId: string,
): void {
  if (samples.length === 0) return;
  const csv = samplesToCsv(samples);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `latency-${matchId}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-800 py-1">
      <span className="text-slate-500">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
