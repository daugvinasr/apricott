import { expect, it } from "vite-plus/test";
import { Sensor } from "../core/commands/identity";
import { TransportError } from "../core/errors";
import { fakeBus } from "./fake-bus";
import { LiftOff, readLiftOff, supportedLiftOffs } from "../core/commands/lift-off";
import {
  PerformanceMode,
  readSensorMode,
  writeSensorMode,
} from "../core/commands/performance-mode";
import { readAngleSnapping, writeMotionSync } from "../core/commands/sensor";

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
  await writeSensorMode(bus, { performance: PerformanceMode.wired, highFps: true });
  expect(writes).toEqual([{ op: 0x04, args: [5, 0x82] }]);
});

it("offers 0.7 mm lift-off only on PAW3950", () => {
  expect(supportedLiftOffs(Sensor.PAW3395)).toEqual([LiftOff.mm1, LiftOff.mm2]);
  expect(supportedLiftOffs(Sensor.PAW3950)).toEqual([LiftOff.mm1, LiftOff.mm2, LiftOff.mm07]);
});
