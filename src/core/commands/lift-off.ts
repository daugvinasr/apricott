import { TransportError } from "../errors";
import { isValueOf } from "../bytes";
import { Sensor } from "./identity";
import { readSensorOption, SensorSub, writeSensorOption } from "./sensor";
import type { Bus } from "./shared";

export const LiftOff = {
  mm1: 0,
  mm2: 1,
  mm07: 2, // Only PAW3950
} as const;

export type LiftOff = (typeof LiftOff)[keyof typeof LiftOff];

export const isLiftOff = isValueOf(LiftOff);

// 0.7 mm is only available on the PAW3950
export function supportedLiftOffs(sensor: Sensor): readonly LiftOff[] {
  const all = Object.values(LiftOff);
  return sensor === Sensor.PAW3950 ? all : all.filter((v) => v !== LiftOff.mm07);
}

export async function readLiftOff(t: Bus): Promise<LiftOff> {
  const v = await readSensorOption(t, SensorSub.liftOff);

  if (!isLiftOff(v)) {
    throw new TransportError(`Unknown lift-off value ${v}`);
  }

  return v;
}

export async function writeLiftOff(t: Bus, value: LiftOff): Promise<void> {
  return writeSensorOption(t, SensorSub.liftOff, value);
}
