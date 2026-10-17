import { NextResponse } from "next/server";
import { appendEvent, type EngagementEvent } from "@/lib/engagement";

export async function POST(req: Request) {
  const body = (await req.json()) as EngagementEvent | { events: EngagementEvent[] };
  const events = "events" in body ? body.events : [body];
  for (const e of events) {
    if (!e || typeof e !== "object" || typeof e.ts !== "number") continue;
    appendEvent(e);
  }
  return NextResponse.json({ ok: true, count: events.length });
}
