import { le16Bytes } from "../bytes";
import { assertRange, type Bus, Op, readSub } from "./shared";
import { TimingSub } from "./timing";

export async function readSleepTimer(t: Bus): Promise<number> {
  const r = await readSub(t, Op.timingOptions, TimingSub.sleepTimer);
  return r.le16(0);
}

export async function writeSleepTimer(t: Bus, seconds: number): Promise<void> {
  assertRange("seconds", seconds, 0, 0xffff);
  return t.write(Op.timingOptions, [TimingSub.sleepTimer, ...le16Bytes(seconds)]);
}
