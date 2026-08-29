import { expect, it } from "vite-plus/test";
import { fakeBus } from "./fake-bus";
import { MAX_DEBOUNCE_MS, MIN_DEBOUNCE_MS, readDebounce, writeDebounce } from "../core/commands/debounce";
import { readSleepTimer, writeSleepTimer } from "../core/commands/sleep";
import { TransportError } from "../core/errors";
import { readRapidFire, writeRapidFire } from "../core/commands/timing";

it("debounce", async () => {
  const { bus, writes } = fakeBus(() => [1, 12]);
  expect(await readDebounce(bus)).toBe(12);
  await writeDebounce(bus, 30);
  expect(writes).toEqual([{ op: 0x05, args: [1, 30] }]);
  await expect(writeDebounce(bus, MAX_DEBOUNCE_MS + 1)).rejects.toThrow(RangeError);
  await expect(writeDebounce(bus, MIN_DEBOUNCE_MS - 1)).rejects.toThrow(RangeError);
});

it("rapid fire with LE16 interval", async () => {
  const { bus, writes } = fakeBus(() => [2, 3, 0x2c, 0x01]);
  expect(await readRapidFire(bus)).toEqual({ repeats: 3, intervalMs: 300 });
  await writeRapidFire(bus, { repeats: 3, intervalMs: 300 });
  expect(writes).toEqual([{ op: 0x05, args: [2, 3, 0x2c, 0x01] }]);
});

it("sleep timer LE16", async () => {
  const { bus, writes } = fakeBus(() => [3, 0x84, 0x03]);
  expect(await readSleepTimer(bus)).toBe(900);
  await writeSleepTimer(bus, 900);
  expect(writes).toEqual([{ op: 0x05, args: [3, 0x84, 0x03] }]);
});

it("rejects unknown sleep timer value", async () => {
  const { bus } = fakeBus(() => [3, 0x2b, 0x00]);
  await expect(readSleepTimer(bus)).rejects.toThrow(TransportError);
});
