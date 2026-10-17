"use client";
import Link from "next/link";
import { useStream } from "@/lib/use-stream";
import { ZoneA } from "@/components/ZoneA";
import { ZoneB } from "@/components/ZoneB";
import { ZoneC } from "@/components/ZoneC";
import { ZoneD } from "@/components/ZoneD";
import { ZoneE } from "@/components/ZoneE";
import { BoardQR } from "@/components/BoardQR";

export default function BoardPage() {
  const { state, status, insight } = useStream();

  if (!state || !status?.loaded) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="text-4xl font-black">Spectator Display Board</h1>
        <p className="text-slate-400 max-w-xl">
          No match is currently loaded. Open the admin page to pick a match and
          start the replay.
        </p>
        <Link
          href="/admin"
          className="rounded-md bg-accent text-slate-900 font-semibold px-6 py-3"
        >
          Open admin
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-[1680px] mx-auto grid grid-cols-12 gap-4 auto-rows-min">
        <ZoneA state={state} />
        <ZoneB state={state} />
        <ZoneC state={state} />
        <ZoneD state={state} />
        <ZoneE insight={insight} />
      </div>
      <BoardQR />
    </main>
  );
}
