import { generateObject } from "ai";
import { z } from "zod";
import type { InsightMessage, MatchState } from "./types";
import { appendAudit } from "./insight-audit";

type FactPack = {
  trigger: string;
  facts: Record<string, number | string>;
  numericKeys: string[];
};

type InsightMemory = {
  lastEmitBall: number;
  lastWinProb: number | null;
  lastInsightOverIndex: number;
  seenMilestones: Set<string>;
  lastBallIndex: number;
};

const g = globalThis as unknown as { __insight__?: InsightMemory };

function memory(): InsightMemory {
  if (!g.__insight__) {
    g.__insight__ = {
      lastEmitBall: -1000,
      lastWinProb: null,
      lastInsightOverIndex: -2,
      seenMilestones: new Set(),
      lastBallIndex: -1,
    };
  }
  return g.__insight__;
}

export function resetInsightMemory(): void {
  g.__insight__ = undefined;
}

export async function maybeGenerateInsight(
  state: MatchState,
): Promise<InsightMessage | null> {
  const mem = memory();
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings;
  if (!inn || !state.lastEvent) return null;

  const factPack = detectTrigger(state, mem);
  if (!factPack) return null;

  const overIndex = state.lastEvent.over;
  const sinceLast = overIndex - mem.lastInsightOverIndex;
  if (factPack.trigger !== "wicket" && sinceLast < 2) return null;

  const llmAttempted = !!process.env.AI_GATEWAY_API_KEY;
  const llmResult = llmAttempted
    ? await callLLM(factPack).catch((err: unknown) => ({
        text: null,
        error: err instanceof Error ? err.message : String(err),
      }))
    : { text: null, error: "no_api_key" as const };

  let validatorPassed: boolean | null = null;
  let source: InsightMessage["source"] = "llm";
  let finalText = llmResult.text;
  if (finalText) {
    validatorPassed = validateNumbers(finalText, factPack);
    if (!validatorPassed) {
      finalText = templateFallback(factPack);
      source = "template";
    }
  } else {
    finalText = templateFallback(factPack);
    source = "template";
  }

  appendAudit({
    ts: Date.now(),
    matchId: state.meta.matchId,
    trigger: factPack.trigger,
    over: `${state.lastEvent.over}.${state.lastEvent.legalBallInOver}`,
    factPack: factPack.facts,
    llmAttempted,
    llmText: llmResult.text,
    llmError: llmAttempted ? llmResult.error : "no_api_key",
    validatorPassed,
    source,
    finalText,
  });

  mem.lastInsightOverIndex = overIndex;
  mem.lastEmitBall = state.lastEvent.globalBallIndex;

  return {
    id: `insight-${Date.now()}`,
    text: finalText,
    trigger: factPack.trigger,
    factKeys: factPack.numericKeys,
    source,
    createdAt: Date.now(),
  };
}

function detectTrigger(state: MatchState, mem: InsightMemory): FactPack | null {
  const event = state.lastEvent!;
  const inn =
    state.currentInnings === 1 ? state.firstInnings : state.secondInnings!;

  if (event.globalBallIndex <= mem.lastBallIndex) return null;
  mem.lastBallIndex = event.globalBallIndex;

  if (event.isWicket && event.playerOut) {
    const batter = inn.batters[event.playerOut];
    return {
      trigger: "wicket",
      facts: {
        batter: event.playerOut,
        runs: batter.runs,
        balls: batter.balls,
        team_runs: inn.runs,
        team_wickets: inn.wickets,
        team: inn.team,
        over: `${event.over}.${event.legalBallInOver}`,
      },
      numericKeys: ["runs", "balls", "team_runs", "team_wickets"],
    };
  }

  const striker = inn.batters[inn.currentStriker ?? ""];
  if (striker) {
    for (const milestone of [25, 50, 100]) {
      const key = `${inn.team}-${striker.name}-${milestone}`;
      if (striker.runs >= milestone && !mem.seenMilestones.has(key)) {
        mem.seenMilestones.add(key);
        return {
          trigger: "milestone",
          facts: {
            batter: striker.name,
            runs: striker.runs,
            balls: striker.balls,
            fours: striker.fours,
            sixes: striker.sixes,
            milestone,
          },
          numericKeys: ["runs", "balls", "fours", "sixes", "milestone"],
        };
      }
    }
  }

  if (event.legalBallInOver === 6 && event.over === 5) {
    return {
      trigger: "powerplay_end",
      facts: {
        team: inn.team,
        pp_runs: inn.runs,
        pp_wickets: inn.wickets,
      },
      numericKeys: ["pp_runs", "pp_wickets"],
    };
  }

  const wp = state.winProbability?.battingTeam ?? null;
  if (wp !== null && mem.lastWinProb !== null) {
    const delta = (wp - mem.lastWinProb) * 100;
    if (Math.abs(delta) >= 15) {
      const direction = delta > 0 ? "swing_to_batting" : "swing_to_bowling";
      mem.lastWinProb = wp;
      return {
        trigger: direction,
        facts: {
          swing_pct: Math.round(Math.abs(delta)),
          new_win_prob_pct: Math.round(wp * 100),
          team: inn.team,
        },
        numericKeys: ["swing_pct", "new_win_prob_pct"],
      };
    }
  }
  mem.lastWinProb = wp;

  return null;
}

const InsightSchema = z.object({
  insight: z.string().min(4).max(140),
  factKeys: z.array(z.string()),
});

type LLMResult = { text: string | null; error: string | null };

async function callLLM(factPack: FactPack): Promise<LLMResult> {
  try {
    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4-5",
      schema: InsightSchema,
      prompt: buildPrompt(factPack),
    });
    return { text: object.insight, error: null };
  } catch (err) {
    console.error("llm call failed", err);
    return {
      text: null,
      error: err instanceof Error ? err.message : "api_error",
    };
  }
}

function buildPrompt(factPack: FactPack): string {
  return `You are generating a one-line insight for a cricket spectator display.

Trigger: ${factPack.trigger}
Facts (ONLY use numbers from this JSON):
${JSON.stringify(factPack.facts, null, 2)}

Rules:
- One sentence, at most 18 words.
- Only use numeric values that appear in the Facts above (string values are fine for names/teams).
- No speculation, no numbers you invent.
- Return the keys you actually used in factKeys.`;
}

function validateNumbers(text: string, factPack: FactPack): boolean {
  const allowed = new Set<string>();
  for (const v of Object.values(factPack.facts)) {
    if (typeof v === "number") allowed.add(String(v));
    if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v)) allowed.add(v);
  }
  const matches = text.match(/\d+(\.\d+)?/g) ?? [];
  for (const m of matches) {
    if (!allowed.has(m)) return false;
  }
  return true;
}

function templateFallback(factPack: FactPack): string {
  const f = factPack.facts;
  switch (factPack.trigger) {
    case "wicket":
      return `WICKET! ${f.batter} out for ${f.runs} (${f.balls}). ${f.team} ${f.team_runs}/${f.team_wickets}.`;
    case "milestone":
      return `${f.batter} brings up ${f.milestone} off ${f.balls} balls with ${f.fours} fours, ${f.sixes} sixes.`;
    case "powerplay_end":
      return `End of powerplay: ${f.team} ${f.pp_runs}/${f.pp_wickets}.`;
    case "swing_to_batting":
      return `Momentum shift: win probability swings ${f.swing_pct}% toward ${f.team}, now ${f.new_win_prob_pct}%.`;
    case "swing_to_bowling":
      return `Momentum shift against ${f.team}: ${f.swing_pct}% swing, chasing hopes at ${f.new_win_prob_pct}%.`;
    default:
      return "";
  }
}
