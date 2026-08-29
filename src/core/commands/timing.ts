import { le16Bytes } from "../bytes";
import { assertRange, type Bus, Op, readSub } from "./shared";

export const TimingSub = {
  debounce: 1,
  rapidFire: 2,
  sleepTimer: 3,
} as const;

export interface RapidFire {
  repeats: number; // 0 = fire until released, default 3
  intervalMs: number; // default 10
}

export async function readRapidFire(t: Bus): Promise<RapidFire> {
  const r = await readSub(t, Op.timingOptions, TimingSub.rapidFire);
  return { repeats: r.u8(0), intervalMs: r.le16(1) };
}

export async function writeRapidFire(t: Bus, rf: RapidFire): Promise<void> {
  assertRange("repeats", rf.repeats, 0, 0xff);
  assertRange("intervalMs", rf.intervalMs, 0, 0xffff);
  return t.write(Op.timingOptions, [TimingSub.rapidFire, rf.repeats, ...le16Bytes(rf.intervalMs)]);
}
