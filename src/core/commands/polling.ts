import { type Bus, Op } from "./shared";

export const POLLING_RATES = [1000, 500, 250, 125, 8000, 4000, 2000] as const;

export type PollingRate = (typeof POLLING_RATES)[number];

const POLLING_RATE_SET: ReadonlySet<number> = new Set(POLLING_RATES);

export const isPollingRate = (hz: number): hz is PollingRate => POLLING_RATE_SET.has(hz);

export const pollingHzToIndex = (hz: PollingRate): number => POLLING_RATES.indexOf(hz);

export function pollingIndexToHz(index: number): PollingRate {
  const hz = POLLING_RATES[index];

  if (hz === undefined) {
    throw new RangeError(`Unsupported polling rate index ${index}`);
  }

  return hz;
}

// Over 1k do not allow to choose performance mode
// and always show visually "wired" (don't write it)
export const isHighRate = (hz: number): boolean => hz >= 2000;

export async function readPollingRate(t: Bus): Promise<PollingRate> {
  const r = await t.read(Op.pollingRate);
  return pollingIndexToHz(r.u8(0));
}

export async function writePollingRate(t: Bus, hz: PollingRate): Promise<void> {
  return t.write(Op.pollingRate, [pollingHzToIndex(hz)]);
}
