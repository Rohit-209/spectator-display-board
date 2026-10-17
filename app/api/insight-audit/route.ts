import { NextResponse } from "next/server";
import { readAuditSummary, exportAuditJsonl } from "@/lib/insight-audit";

export function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "jsonl") {
    return new Response(exportAuditJsonl(), {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
      },
    });
  }
  return NextResponse.json(readAuditSummary(), {
    headers: { "Cache-Control": "no-store" },
  });
}
