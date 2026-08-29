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
