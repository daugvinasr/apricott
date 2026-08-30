import { expect, it } from "vite-plus/test";
import { fakeBus } from "./fake-bus";
import { readStages, writeStages } from "@/core/commands";

it("reads all five bytes unclamped", async () => {
  const { bus } = fakeBus(() => [0, 4, 2, 1, 1]);
  expect(await readStages(bus)).toEqual({ count: 0, active: 4, dpiEffect: 2, reserved: [1, 1] });
});

it("writes all five bytes", async () => {
  const { bus, writes } = fakeBus();
  await writeStages(bus, { count: 4, active: 1, dpiEffect: 1, reserved: [1, 1] });
  expect(writes).toEqual([{ op: 0x03, args: [4, 1, 1, 1, 1] }]);
});

it("enforces active < count", async () => {
  const { bus } = fakeBus();
  await expect(
    writeStages(bus, { count: 2, active: 2, dpiEffect: 0, reserved: [1, 1] }),
  ).rejects.toThrow(RangeError);
});
