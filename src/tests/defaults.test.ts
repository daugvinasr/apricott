import { expect, it } from "vite-plus/test";
import { factoryDefaults, resetToDefaults, Sensor } from "@/core/commands";
import { fakeBus } from "./fake-bus";

const dpiWrites = (axis: number) =>
  [7, 15, 31, 47, 63, 127].map((hw, stage) => ({ op: 0x02, args: [stage, hw, 0, 0, 0, 0, axis] }));

it("dpi defaults are 400 to 6400", () => {
  expect(factoryDefaults().dpi.map((s) => s.dpi)).toEqual([400, 800, 1600, 2400, 3200, 6400]);
});

it("writes every default and reports progress", async () => {
  const { bus, writes } = fakeBus();
  const progress: number[] = [];

  await resetToDefaults(bus, Sensor.PAW3950, (done, total) => progress.push(done / total));

  expect(writes).toEqual([
    { op: 0x01, args: [0] },
    ...dpiWrites(1),
    ...dpiWrites(2),
    { op: 0x03, args: [6, 1, 1, 1, 1] },
    { op: 0x04, args: [1, 0] },
    { op: 0x04, args: [4, 1] },
    { op: 0x04, args: [5, 1] },
    { op: 0x05, args: [1, 8] },
    { op: 0x05, args: [3, 60, 0] },
    { op: 0x05, args: [2, 3, 10, 0] },
    { op: 0x06, args: [0, 0x01, 0x00, 0xf0, 0x00] },
    { op: 0x06, args: [1, 0x01, 0x00, 0xf1, 0x00] },
    { op: 0x06, args: [2, 0x01, 0x00, 0xf2, 0x00] },
    { op: 0x06, args: [3, 0x01, 0x00, 0xf3, 0x00] },
    { op: 0x06, args: [4, 0x01, 0x00, 0xf4, 0x00] },
    { op: 0x06, args: [5, 0x07, 0x00, 0x03, 0x00] },
  ]);
  expect(progress).toHaveLength(writes.length);
  expect(progress.at(-1)).toBe(1);
});
