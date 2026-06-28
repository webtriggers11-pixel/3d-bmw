import { EventEmitter } from "events";

/**
 * In-process event bus for live updates (SSE). A global singleton survives
 * hot-reload. NOTE: single-process only — for multi-instance production, back
 * this with Redis pub/sub. Fine for v1.
 */
const globalForBus = globalThis as unknown as { bus: EventEmitter | undefined };

export const bus: EventEmitter = globalForBus.bus ?? new EventEmitter();
bus.setMaxListeners(0);

if (process.env.NODE_ENV !== "production") {
  globalForBus.bus = bus;
}

export type NameEvent = {
  type: "new-name";
  carIndex: number;
  name: string;
};

export const NAME_EVENT = "new-name";
