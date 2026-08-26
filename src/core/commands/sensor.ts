import { TransportError } from "../errors";
import { hex, isValueOf } from "../bytes";
import { type Bus, Op, readSub } from "./shared";

const Sub = {
  liftOff: 1,
  ripple: 2,
  angleSnapping: 3,
  motionSync: 4,
  sensorMode: 5,
} as const;

async function readOption(t: Bus, sub: number): Promise<number> {
  const r = await readSub(t, Op.sensorOptions, sub);
  return r.u8(0);
}

async function writeOption(t: Bus, sub: number, value: number): Promise<void> {
  return t.write(Op.sensorOptions, [sub, value]);
}

const readFlag = async (t: Bus, sub: number) => (await readOption(t, sub)) === 1;
const writeFlag = (t: Bus, sub: number, on: boolean) => writeOption(t, sub, on ? 1 : 0);

export const LiftOff = {
  mm1: 0,
  mm2: 1,
  mm07: 2, // Only PAW3950
} as const;

export type LiftOff = (typeof LiftOff)[keyof typeof LiftOff];

const isLiftOff = isValueOf(LiftOff);

export async function readLiftOff(t: Bus): Promise<LiftOff> {
  const v = await readOption(t, Sub.liftOff);

  if (!isLiftOff(v)) {
    throw new TransportError(`Unknown lift-off value ${v}`);
  }

  return v;
}

export async function writeLiftOff(t: Bus, value: LiftOff): Promise<void> {
  return writeOption(t, Sub.liftOff, value);
}

export const readRippleControl = (t: Bus) => readFlag(t, Sub.ripple);
export const writeRippleControl = (t: Bus, on: boolean) => writeFlag(t, Sub.ripple, on);

export const readAngleSnapping = (t: Bus) => readFlag(t, Sub.angleSnapping);
export const writeAngleSnapping = (t: Bus, on: boolean) => writeFlag(t, Sub.angleSnapping, on);

export const readMotionSync = (t: Bus) => readFlag(t, Sub.motionSync);
export const writeMotionSync = (t: Bus, on: boolean) => writeFlag(t, Sub.motionSync, on);

export const PerformanceMode = {
  lowPower: 0,
  highPerformance: 1,
  corded: 2,
} as const;

export type PerformanceMode = (typeof PerformanceMode)[keyof typeof PerformanceMode];

const isPerformanceMode = isValueOf(PerformanceMode);

const HIGH_FPS_BIT = 0x80;

export interface SensorMode {
  performance: PerformanceMode;
  highFps: boolean; // Only corded PAW3950
}

export async function readSensorMode(t: Bus): Promise<SensorMode> {
  const v = await readOption(t, Sub.sensorMode);
  const performance = v & 0x7f;

  if (!isPerformanceMode(performance)) {
    throw new TransportError(`Unknown sensor mode ${hex(v)}`);
  }

  return { performance, highFps: (v & HIGH_FPS_BIT) !== 0 };
}

export async function writeSensorMode(t: Bus, sm: SensorMode): Promise<void> {
  return writeOption(t, Sub.sensorMode, sm.performance | (sm.highFps ? HIGH_FPS_BIT : 0));
}
