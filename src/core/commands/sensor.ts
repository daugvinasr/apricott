import { TransportError } from "../errors";
import { hex, isValueOf } from "../bytes";
import { type Bus, Op, readSub } from "./shared";

export const SensorSub = {
  liftOff: 1,
  ripple: 2,
  angleSnapping: 3,
  motionSync: 4,
  sensorMode: 5,
} as const;

export async function readSensorOption(t: Bus, sub: number): Promise<number> {
  const r = await readSub(t, Op.sensorOptions, sub);
  return r.u8(0);
}

export async function writeSensorOption(t: Bus, sub: number, value: number): Promise<void> {
  return t.write(Op.sensorOptions, [sub, value]);
}

const readFlag = async (t: Bus, sub: number) => (await readSensorOption(t, sub)) === 1;
const writeFlag = (t: Bus, sub: number, on: boolean) => writeSensorOption(t, sub, on ? 1 : 0);

export const readRippleControl = (t: Bus) => readFlag(t, SensorSub.ripple);
export const writeRippleControl = (t: Bus, on: boolean) => writeFlag(t, SensorSub.ripple, on);

export const readAngleSnapping = (t: Bus) => readFlag(t, SensorSub.angleSnapping);
export const writeAngleSnapping = (t: Bus, on: boolean) => writeFlag(t, SensorSub.angleSnapping, on);

export const readMotionSync = (t: Bus) => readFlag(t, SensorSub.motionSync);
export const writeMotionSync = (t: Bus, on: boolean) => writeFlag(t, SensorSub.motionSync, on);

export const PerformanceMode = {
  lowPower: 0,
  highPerformance: 1,
  wired: 2,
} as const;

export type PerformanceMode = (typeof PerformanceMode)[keyof typeof PerformanceMode];

const isPerformanceMode = isValueOf(PerformanceMode);

const HIGH_FPS_BIT = 0x80;

export interface SensorMode {
  performance: PerformanceMode;
  highFps: boolean; // only wired PAW3950
}

export async function readSensorMode(t: Bus): Promise<SensorMode> {
  const v = await readSensorOption(t, SensorSub.sensorMode);
  const performance = v & 0x7f;

  if (!isPerformanceMode(performance)) {
    throw new TransportError(`Unknown sensor mode ${hex(v)}`);
  }

  return { performance, highFps: (v & HIGH_FPS_BIT) !== 0 };
}

export async function writeSensorMode(t: Bus, sm: SensorMode): Promise<void> {
  return writeSensorOption(t, SensorSub.sensorMode, sm.performance | (sm.highFps ? HIGH_FPS_BIT : 0));
}
