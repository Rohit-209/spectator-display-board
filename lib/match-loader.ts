import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseCricsheetMatch } from "./parse-cricsheet";
import type { BallEvent, MatchMeta } from "./types";

const MATCH_DIR = path.join(process.cwd(), "data", "matches");

export async function listMatches(): Promise<
  { matchId: string; teams: [string, string]; date: string | null; city: string | null }[]
> {
  const files = await readdir(MATCH_DIR);
  const matches: {
    matchId: string;
    teams: [string, string];
    date: string | null;
    city: string | null;
  }[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const matchId = file.replace(/\.json$/, "");
    const raw = JSON.parse(await readFile(path.join(MATCH_DIR, file), "utf8"));
    matches.push({
      matchId,
      teams: raw.info.teams as [string, string],
      date: raw.info.dates?.[0] ?? null,
      city: raw.info.city ?? null,
    });
  }
  return matches.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function loadMatch(
  matchId: string,
): Promise<{ meta: MatchMeta; events: BallEvent[] }> {
  const raw = JSON.parse(
    await readFile(path.join(MATCH_DIR, `${matchId}.json`), "utf8"),
  );
  return parseCricsheetMatch(matchId, raw);
}
