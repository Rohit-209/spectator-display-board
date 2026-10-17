import { NextResponse } from "next/server";
import { getBatterComparison, getMatchSeason } from "@/lib/compare";

export function GET(req: Request) {
  const url = new URL(req.url);
  const batters = url.searchParams.getAll("batter");
  const matchId = url.searchParams.get("matchId");
  const explicitSeason = url.searchParams.get("season");

  if (batters.length === 0) {
    return NextResponse.json({ error: "batter query param required" }, { status: 400 });
  }

  const season =
    explicitSeason ?? (matchId ? getMatchSeason(matchId) : null);

  const result = batters.map((b) => getBatterComparison(b, season));
  return NextResponse.json(
    { season, comparisons: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
