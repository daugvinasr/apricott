import { le16Bytes } from "../bytes";
import { TransportError } from "../errors";
import { type Bus, Op, readSub } from "./shared";
import { TimingSub } from "./timing";

export const SLEEP_TIMERS = [
  10, 20, 30, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660, 720, 780, 840, 900,
] as const;

export type SleepTimer = (typeof SLEEP_TIMERS)[number];

export const DEFAULT_SLEEP_TIMER: SleepTimer = 60;

const SLEEP_TIMER_SET: ReadonlySet<number> = new Set(SLEEP_TIMERS);

export const isSleepTimer = (seconds: number): seconds is SleepTimer =>
  SLEEP_TIMER_SET.has(seconds);

export async function readSleepTimer(t: Bus): Promise<SleepTimer> {
  const r = await readSub(t, Op.timingOptions, TimingSub.sleepTimer);
  const seconds = r.le16(0);

  if (!isSleepTimer(seconds)) {
    throw new TransportError(`Unknown sleep timer value ${seconds}`);
  }

  return seconds;
}

export async function writeSleepTimer(t: Bus, seconds: SleepTimer): Promise<void> {
  return t.write(Op.timingOptions, [TimingSub.sleepTimer, ...le16Bytes(seconds)]);
}
