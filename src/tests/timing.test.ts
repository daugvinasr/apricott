import { expect, it } from "vite-plus/test";
import { fakeBus } from "./fake-bus";
import {
  readDebounce,
  readRapidFire,
  readSleepTimer,
  writeDebounce,
  writeRapidFire,
  writeSleepTimer,
} from "../core/commands/timing";

it("debounce", async () => {
  const { bus, writes } = fakeBus(() => [1, 12]);
  expect(await readDebounce(bus)).toBe(12);
  await writeDebounce(bus, 30);
  expect(writes).toEqual([{ op: 0x05, args: [1, 30] }]);
  await expect(writeDebounce(bus, 64)).rejects.toThrow(RangeError);
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
