import { NextRequest, NextResponse } from "next/server";
import { load, play, pause, setSpeed, restart, seekToBall, seekToOver, status } from "@/lib/replay";
import { resetInsightMemory } from "@/lib/insights";

type ControlBody =
  | { action: "load"; matchId: string }
  | { action: "play" }
  | { action: "pause" }
  | { action: "restart" }
  | { action: "speed"; speed: number }
  | { action: "seekBall"; index: number }
  | { action: "seekOver"; innings: 1 | 2; over: number };

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ControlBody;
  switch (body.action) {
    case "load":
      resetInsightMemory();
      await load(body.matchId);
      break;
    case "play":
      play();
      break;
    case "pause":
      pause();
      break;
    case "restart":
      resetInsightMemory();
      restart();
      break;
    case "speed":
      setSpeed(body.speed);
      break;
    case "seekBall":
      resetInsightMemory();
      seekToBall(body.index);
      break;
    case "seekOver":
      resetInsightMemory();
      seekToOver(body.innings, body.over);
      break;
    default:
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, status: status() });
}

export async function GET() {
  return NextResponse.json({ status: status() });
}
