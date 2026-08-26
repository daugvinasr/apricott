import { expect, it } from "vite-plus/test";
import { TransportError } from "../core/errors";
import { fakeBus } from "./fake-bus";
import {
  LiftOff,
  readAngleSnapping,
  readLiftOff,
  readSensorMode,
  PerformanceMode,
  writeMotionSync,
  writeSensorMode,
} from "../core/commands/sensor";

it("validates sub-command echo", async () => {
  const { bus } = fakeBus(() => [2, 1]);
  await expect(readLiftOff(bus)).rejects.toThrow(TransportError);
});

it("reads lift-off from rdata[2]", async () => {
  const { bus } = fakeBus(() => [1, LiftOff.mm07]);
  expect(await readLiftOff(bus)).toBe(LiftOff.mm07);
});

it("reads and writes boolean options", async () => {
  const { bus, writes } = fakeBus(() => [3, 1]);
  expect(await readAngleSnapping(bus)).toBe(true);
  await writeMotionSync(bus, false);
  expect(writes).toEqual([{ op: 0x04, args: [4, 0] }]);
});

it("splits sensor mode and high-fps bit", async () => {
  const { bus } = fakeBus(() => [5, 0x81]);
  expect(await readSensorMode(bus)).toEqual({
    performance: PerformanceMode.highPerformance,
    highFps: true,
  });
});

it("writes sensor mode preserving high-fps", async () => {
  const { bus, writes } = fakeBus();
  await writeSensorMode(bus, { performance: PerformanceMode.corded, highFps: true });
  expect(writes).toEqual([{ op: 0x04, args: [5, 0x82] }]);
});
