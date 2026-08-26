import { describe, expect, it } from "vite-plus/test";
import { fakeBus } from "./fake-bus";
import {
  isHighRate,
  isPollingRate,
  POLLING_RATES,
  pollingHzToIndex,
  pollingIndexToHz,
  readPollingRate,
  writePollingRate,
} from "../core/commands/polling";

it("reads polling index from rdata[1]", async () => {
  const { bus } = fakeBus(() => [4]);
  expect(await readPollingRate(bus)).toBe(8000);
});

it("writes polling index", async () => {
  const { bus, writes } = fakeBus();
  await writePollingRate(bus, 2000);
  expect(writes).toEqual([{ op: 0x01, args: [6] }]);
});

describe("polling codec", () => {
  it("maps index <-> Hz in wire order", () => {
    expect([...POLLING_RATES]).toEqual([1000, 500, 250, 125, 8000, 4000, 2000]);
    POLLING_RATES.forEach((hz, i) => {
      expect(pollingHzToIndex(hz)).toBe(i);
      expect(pollingIndexToHz(i)).toBe(hz);
    });
  });

  it("guards unsupported rates and indices", () => {
    expect(isPollingRate(1000)).toBe(true);
    expect(isPollingRate(3000)).toBe(false);
    expect(() => pollingIndexToHz(7)).toThrow(RangeError);
  });

  it("flags ≥2000 Hz as high rate", () => {
    expect(isHighRate(1000)).toBe(false);
    expect(isHighRate(2000)).toBe(true);
    expect(isHighRate(8000)).toBe(true);
  });
});
