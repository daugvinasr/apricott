import { TransportError } from "../errors";
import { hex, isValueOf } from "../bytes";
import { readSensorOption, SensorSub, writeSensorOption } from "./sensor";
import type { Bus } from "./shared";

export const PerformanceMode = {
  lowPower: 0,
  highPerformance: 1,
  wired: 2,
} as const;

export type PerformanceMode = (typeof PerformanceMode)[keyof typeof PerformanceMode];

const isPerformanceMode = isValueOf(PerformanceMode);

const FRAME_RATE_BOOST_BIT = 0x80;

export interface SensorMode {
  performance: PerformanceMode;
  frameRateBoost: boolean; // only wired PAW3950
}

export async function readSensorMode(t: Bus): Promise<SensorMode> {
  const v = await readSensorOption(t, SensorSub.sensorMode);
  const performance = v & 0x7f;

  if (!isPerformanceMode(performance)) {
    throw new TransportError(`Unknown sensor mode ${hex(v)}`);
  }

  return { performance, frameRateBoost: (v & FRAME_RATE_BOOST_BIT) !== 0 };
}

export async function writeSensorMode(t: Bus, sm: SensorMode): Promise<void> {
  return writeSensorOption(
    t,
    SensorSub.sensorMode,
    sm.performance | (sm.frameRateBoost ? FRAME_RATE_BOOST_BIT : 0),
  );
}
