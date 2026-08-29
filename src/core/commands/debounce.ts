import { assertRange, type Bus, Op, readSub } from "./shared";
import { TimingSub } from "./timing";

export const MAX_DEBOUNCE_MS = 30; // default 8

export async function readDebounce(t: Bus): Promise<number> {
  const r = await readSub(t, Op.timingOptions, TimingSub.debounce);
  return r.u8(0);
}

export async function writeDebounce(t: Bus, ms: number): Promise<void> {
  assertRange("debounce", ms, 0, MAX_DEBOUNCE_MS);
  return t.write(Op.timingOptions, [TimingSub.debounce, ms]);
}
