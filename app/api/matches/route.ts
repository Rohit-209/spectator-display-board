import { NextResponse } from "next/server";
import { listMatches } from "@/lib/match-loader";

export async function GET() {
  const matches = await listMatches();
  return NextResponse.json({ matches });
}
