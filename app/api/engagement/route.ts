import { NextResponse } from "next/server";
import { readSummary, readRawJsonl } from "@/lib/engagement";

export function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "jsonl") {
    return new Response(readRawJsonl(), {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
  }
  return NextResponse.json(readSummary(), {
    headers: { "Cache-Control": "no-store" },
  });
}
