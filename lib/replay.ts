import { applyEvent, initialState } from "./stats";
import { winProbability, projectedScore } from "./win-prob";
import { loadMatch } from "./match-loader";
import { publish } from "./pubsub";
import { maybeGenerateInsight } from "./insights";
import type {
  BallEvent,
  MatchMeta,
  MatchState,
  ReplayStatus,
  StreamFrame,
} from "./types";

type EngineState = {
  meta: MatchMeta | null;
  events: BallEvent[];
  state: MatchState | null;
  cursor: number;
  playing: boolean;
  speed: number;
  timer: NodeJS.Timeout | null;
  completed: boolean;
};

const BASE_BALL_INTERVAL_MS = 35_000;

const g = globalThis as unknown as { __replay__?: EngineState };

function engine(): EngineState {
  if (!g.__replay__) {
    g.__replay__ = {
      meta: null,
      events: [],
      state: null,
      cursor: 0,
      playing: false,
      speed: 5,
      timer: null,
      completed: false,
    };
  }
  return g.__replay__;
}

export function status(): ReplayStatus {
  const e = engine();
  return {
    loaded: !!e.state,
    matchId: e.meta?.matchId ?? null,
    playing: e.playing,
    speed: e.speed,
    cursor: e.cursor,
    total: e.events.length,
    completed: e.completed,
  };
}

export function currentFrame(): StreamFrame {
  const e = engine();
  if (!e.state) return { kind: "status", status: status() };
  return { kind: "state", state: e.state, status: status() };
}

export async function load(matchId: string): Promise<void> {
  stop();
  const { meta, events } = await loadMatch(matchId);
  const e = engine();
  e.meta = meta;
  e.events = events;
  e.state = initialState(meta);
  e.cursor = 0;
  e.playing = false;
  e.completed = false;
  publish(currentFrame());
}

export function setSpeed(speed: number): void {
  const e = engine();
  e.speed = Math.max(0.1, Math.min(100, speed));
  if (e.playing) {
    reschedule();
  }
  publish({ kind: "status", status: status() });
}

export function play(): void {
  const e = engine();
  if (!e.state || e.completed) return;
  if (e.playing) return;
  e.playing = true;
  reschedule();
  publish({ kind: "status", status: status() });
}

export function pause(): void {
  const e = engine();
  e.playing = false;
  if (e.timer) {
    clearTimeout(e.timer);
    e.timer = null;
  }
  publish({ kind: "status", status: status() });
}

export function stop(): void {
  const e = engine();
  if (e.timer) {
    clearTimeout(e.timer);
    e.timer = null;
  }
  e.playing = false;
}

export function seekToBall(index: number): void {
  const e = engine();
  if (!e.meta) return;
  stop();
  const target = Math.max(0, Math.min(e.events.length, index));
  e.state = initialState(e.meta);
  for (let i = 0; i < target; i++) {
    e.state = applyEvent(e.state, e.events[i]);
  }
  e.state = withDerived(e.state);
  e.cursor = target;
  e.completed = target >= e.events.length;
  publish(currentFrame());
}

export function seekToOver(innings: 1 | 2, over: number): void {
  const e = engine();
  const idx = e.events.findIndex(
    (ev) => ev.innings === innings && ev.over >= over,
  );
  if (idx >= 0) seekToBall(idx);
}

export function restart(): void {
  seekToBall(0);
}

function reschedule(): void {
  const e = engine();
  if (e.timer) {
    clearTimeout(e.timer);
    e.timer = null;
  }
  if (!e.playing) return;
  const delay = BASE_BALL_INTERVAL_MS / e.speed;
  e.timer = setTimeout(step, Math.max(50, delay));
}

async function step(): Promise<void> {
  const e = engine();
  if (!e.playing || !e.state) return;
  if (e.cursor >= e.events.length) {
    e.playing = false;
    e.completed = true;
    publish({ kind: "status", status: status() });
    return;
  }
  const event = { ...e.events[e.cursor], emittedAt: Date.now() };
  e.state = applyEvent(e.state, event);
  e.state = withDerived(e.state);
  e.cursor += 1;
  publish(currentFrame());

  const insightMessage = await maybeGenerateInsight(e.state).catch((err) => {
    console.error("insight error", err);
    return null;
  });
  if (insightMessage) {
    e.state = { ...e.state, insight: insightMessage };
    publish({ kind: "insight", insight: insightMessage });
    publish(currentFrame());
  }

  reschedule();
}

function withDerived(state: MatchState): MatchState {
  return {
    ...state,
    winProbability: winProbability(state),
    projectedScore: projectedScore(state),
  };
}
