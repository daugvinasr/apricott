import { expect, it } from "vite-plus/test";
import { Frame } from "@/core/bytes";
import { LiftOff, parseInputReport } from "@/core/commands";

const view = (bytes: number[]) => new Frame(Uint8Array.from(bytes));

it("unpacks all fields", () => {
  const d = view([0x80 | 57, 0x24, 0x40 | 8, 0, 0, 0, 0x11, 0]);
  expect(parseInputReport(d)).toEqual({
    charging: true,
    batteryPercent: 57,
    pollingRateHz: 8000,
    activeStage: 2,
    debounceMs: 8,
    activeProfile: 1,
    motionSync: true,
    liftOff: LiftOff.mm2,
  });
});

it("reads zero state", () => {
  expect(parseInputReport(view([100, 0, 0, 0, 0, 0, 0, 0]))).toEqual({
    charging: false,
    batteryPercent: 100,
    pollingRateHz: 1000,
    activeStage: 0,
    debounceMs: 0,
    activeProfile: 0,
    motionSync: false,
    liftOff: LiftOff.mm1,
  });
});
