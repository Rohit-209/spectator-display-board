import type { StreamFrame } from "./types";

type Subscriber = (frame: StreamFrame) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function publish(frame: StreamFrame): void {
  for (const fn of subscribers) {
    try {
      fn(frame);
    } catch (err) {
      console.error("subscriber error", err);
    }
  }
}

export function subscriberCount(): number {
  return subscribers.size;
}
