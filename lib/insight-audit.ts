import { getDb } from "./db";

export type AuditEntry = {
  ts: number;
  matchId: string;
  trigger: string;
  over: string;
  factPack: Record<string, unknown>;
  llmAttempted: boolean;
  llmText: string | null;
  llmError: string | null;
  validatorPassed: boolean | null;
  source: "llm" | "template";
  finalText: string;
};

export function appendAudit(entry: AuditEntry): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO insight_audit
         (ts, match_id, trigger, over, fact_pack, llm_attempted,
          llm_text, llm_error, validator_passed, source, final_text)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      entry.ts,
      entry.matchId,
      entry.trigger,
      entry.over,
      JSON.stringify(entry.factPack),
      entry.llmAttempted ? 1 : 0,
      entry.llmText,
      entry.llmError,
      entry.validatorPassed === null ? null : entry.validatorPassed ? 1 : 0,
      entry.source,
      entry.finalText,
    );
  } catch (err) {
    console.error("insight audit append failed", err);
  }
}

export type AuditSummary = {
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

export function readAuditSummary(): AuditSummary {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN llm_attempted = 1 THEN 1 ELSE 0 END) AS llm_attempted,
         SUM(CASE WHEN llm_text IS NOT NULL THEN 1 ELSE 0 END) AS llm_returned,
         SUM(CASE WHEN validator_passed = 1 THEN 1 ELSE 0 END) AS validator_passed,
         SUM(CASE WHEN validator_passed = 0 THEN 1 ELSE 0 END) AS validator_failed,
         SUM(CASE WHEN llm_attempted = 1 AND llm_error IS NOT NULL THEN 1 ELSE 0 END) AS llm_errors,
         SUM(CASE WHEN source = 'template' THEN 1 ELSE 0 END) AS template_fallbacks
       FROM insight_audit`,
    )
    .get() as Record<string, number | null>;

  const byTrigger: Record<string, number> = {};
  for (const r of db
    .prepare(
      `SELECT trigger, COUNT(*) AS n FROM insight_audit GROUP BY trigger`,
    )
    .all() as Array<{ trigger: string; n: number }>) {
    byTrigger[r.trigger] = r.n;
  }

  const returned = Number(row.llm_returned ?? 0);
  const failed = Number(row.validator_failed ?? 0);

  return {
    total: Number(row.total ?? 0),
    llmAttempted: Number(row.llm_attempted ?? 0),
    llmReturnedText: returned,
    llmValidatorPassed: Number(row.validator_passed ?? 0),
    llmValidatorFailed: failed,
    llmErrors: Number(row.llm_errors ?? 0),
    templateFallbacks: Number(row.template_fallbacks ?? 0),
    rejectionRate: returned > 0 ? failed / returned : null,
    byTrigger,
  };
}

export function exportAuditJsonl(): string {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ts, match_id, trigger, over, fact_pack,
              llm_attempted, llm_text, llm_error, validator_passed,
              source, final_text
         FROM insight_audit ORDER BY id ASC`,
    )
    .all() as Array<Record<string, unknown>>;
  return rows
    .map((r) =>
      JSON.stringify({
        ts: r.ts,
        matchId: r.match_id,
        trigger: r.trigger,
        over: r.over,
        factPack: JSON.parse(String(r.fact_pack)),
        llmAttempted: r.llm_attempted === 1,
        llmText: r.llm_text,
        llmError: r.llm_error,
        validatorPassed:
          r.validator_passed === null ? null : r.validator_passed === 1,
        source: r.source,
        finalText: r.final_text,
      }),
    )
    .join("\n");
}
