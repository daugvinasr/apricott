import { le16Bytes } from "../bytes";
import { assertRange, type Bus, Op, readSub } from "./shared";

const Sub = {
  debounce: 1,
  rapidFire: 2,
  sleepTimer: 3,
} as const;

export const MAX_DEBOUNCE_MS = 30; // default 8

export async function readDebounce(t: Bus): Promise<number> {
  const r = await readSub(t, Op.timingOptions, Sub.debounce);
  return r.u8(0);
}

export async function writeDebounce(t: Bus, ms: number): Promise<void> {
  assertRange("debounce", ms, 0, MAX_DEBOUNCE_MS);
  return t.write(Op.timingOptions, [Sub.debounce, ms]);
}

export interface RapidFire {
  repeats: number; // 0 = fire until released, default 3
  intervalMs: number; // default 10
}

export async function readRapidFire(t: Bus): Promise<RapidFire> {
  const r = await readSub(t, Op.timingOptions, Sub.rapidFire);
  return { repeats: r.u8(0), intervalMs: r.le16(1) };
}

export async function writeRapidFire(t: Bus, rf: RapidFire): Promise<void> {
  assertRange("repeats", rf.repeats, 0, 0xff);
  assertRange("intervalMs", rf.intervalMs, 0, 0xffff);
  return t.write(Op.timingOptions, [Sub.rapidFire, rf.repeats, ...le16Bytes(rf.intervalMs)]);
}

export async function readSleepTimer(t: Bus): Promise<number> {
  const r = await readSub(t, Op.timingOptions, Sub.sleepTimer);
  return r.le16(0);
}

export async function writeSleepTimer(t: Bus, seconds: number): Promise<void> {
  assertRange("seconds", seconds, 0, 0xffff);
  return t.write(Op.timingOptions, [Sub.sleepTimer, ...le16Bytes(seconds)]);
}
