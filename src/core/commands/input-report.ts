import type { Frame } from "../bytes";
import { type PollingRate, pollingIndexToHz } from "./polling";

export interface InputReport {
  charging: boolean;
  batteryPercent: number;
  pollingRateHz: PollingRate;
  activeStage: number;
  debounceMs: number;
  activeProfile: number;
  motionSync: boolean;
  lodValue: number;
}

export function parseInputReport(f: Frame): InputReport {
  const b0 = f.u8(0);
  const b1 = f.u8(1);
  const b2 = f.u8(2);
  const b6 = f.u8(6);
  return {
    charging: (b0 & 0x80) !== 0,
    batteryPercent: b0 & 0x7f,
    pollingRateHz: pollingIndexToHz(b1 & 0x0f),
    activeStage: b1 >> 4,
    debounceMs: b2 & 0x3f,
    activeProfile: b2 >> 6,
    motionSync: (b6 & 0x0f) !== 0,
    lodValue: b6 >> 4,
  };
}
