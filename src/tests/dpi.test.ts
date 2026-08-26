import { describe, expect, it } from "vite-plus/test";
import { Sensor } from "../core/commands/identity";
import {
  DpiAxis,
  dpiToHw,
  hwToDpi,
  readDpiStage,
  snapDpi,
  writeDpiStage,
} from "../core/commands/dpi";
import { fakeBus } from "./fake-bus";

it("reads LE16 hw and reserved, validating stage echo", async () => {
  const { bus, reads } = fakeBus((_, [stage]) => [stage ?? 0, 0x83, 0x03, 7, 8, 9]);
  const s = await readDpiStage(bus, Sensor.PAW3950, 2, DpiAxis.x);
  expect(reads).toEqual([{ op: 0x02, args: [2, 1] }]);
  expect(s).toEqual({ dpi: 45000, reserved: [7, 8, 9] });
});

it("writes both bytes and preserves reserved", async () => {
  const { bus, writes } = fakeBus();
  await writeDpiStage(bus, Sensor.PAW3395, 3, DpiAxis.y, { dpi: 32000, reserved: [7, 8, 9] });
  expect(writes).toEqual([{ op: 0x02, args: [3, 0x7f, 0x02, 7, 8, 9, 2] }]);
});

it("rejects out-of-range or off-step dpi", async () => {
  const { bus } = fakeBus();
  const reserved = [0, 0, 0] as const;
  await expect(
    writeDpiStage(bus, Sensor.PAW3395, 0, DpiAxis.x, { dpi: 40000, reserved: [...reserved] }),
  ).rejects.toThrow(RangeError);
  await expect(
    writeDpiStage(bus, Sensor.PAW3395, 0, DpiAxis.x, { dpi: 825, reserved: [...reserved] }),
  ).rejects.toThrow(RangeError);
});

describe("dpi codec", () => {
  it("encodes per the protocol table", () => {
    expect(dpiToHw(Sensor.PAW3395, 50)).toBe(0);
    expect(dpiToHw(Sensor.PAW3395, 1600)).toBe(31);
    expect(dpiToHw(Sensor.PAW3395, 12800)).toBe(255);
    expect(dpiToHw(Sensor.PAW3395, 32000)).toBe(639);
    expect(dpiToHw(Sensor.PAW3950, 45000)).toBe(899);
  });

  it("decodes per the protocol table", () => {
    expect(hwToDpi(Sensor.PAW3395, 0)).toBe(50);
    expect(hwToDpi(Sensor.PAW3395, 31)).toBe(1600);
    expect(hwToDpi(Sensor.PAW3395, 639)).toBe(32000);
    expect(hwToDpi(Sensor.PAW3950, 899)).toBe(45000);
  });

  it("round-trips every hw value", () => {
    for (let hw = 0; hw <= 899; hw++) {
      expect(dpiToHw(Sensor.PAW3950, hwToDpi(Sensor.PAW3950, hw))).toBe(hw);
    }
  });

  it("clamps to the sensor range", () => {
    expect(dpiToHw(Sensor.PAW3395, 0)).toBe(0);
    expect(dpiToHw(Sensor.PAW3395, 99999)).toBe(639);
    expect(dpiToHw(Sensor.PAW3950, 99999)).toBe(899);
  });

  it("snaps to 50-DPI steps", () => {
    expect(snapDpi(Sensor.PAW3395, 1620)).toBe(1600);
    expect(snapDpi(Sensor.PAW3395, 1630)).toBe(1600);
    expect(snapDpi(Sensor.PAW3395, 1699)).toBe(1650);
    expect(snapDpi(Sensor.PAW3395, 40000)).toBe(32000);
  });
});
