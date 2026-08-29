import { assertRange, type Bus, Op, readSub } from "./shared";
import { TimingSub } from "./timing";

export const MIN_DEBOUNCE_MS = 0;
export const MAX_DEBOUNCE_MS = 30;
export const DEFAULT_DEBOUNCE_MS = 8;

export async function readDebounce(t: Bus): Promise<number> {
  const r = await readSub(t, Op.timingOptions, TimingSub.debounce);
  return r.u8(0);
}

export async function writeDebounce(t: Bus, ms: number): Promise<void> {
  assertRange("debounce", ms, MIN_DEBOUNCE_MS, MAX_DEBOUNCE_MS);
  return t.write(Op.timingOptions, [TimingSub.debounce, ms]);
}
