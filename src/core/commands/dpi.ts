import { hex, le16Bytes } from "../bytes";
import { Sensor } from "./identity";
import { assertRange, type Bus, MAX_DPI_STAGES, Op, readSub } from "./shared";

export interface DpiRange {
  min: number;
  max: number;
  step: number;
}

export const SENSOR_DPI = {
  [Sensor.PAW3395]: { min: 50, max: 32000, step: 50 },
  [Sensor.PAW3950]: { min: 50, max: 45000, step: 50 },
} satisfies Record<Sensor, DpiRange>;

export function dpiToHw(sensor: Sensor, dpi: number): number {
  const { min, max, step } = SENSOR_DPI[sensor];
  const clamped = Math.min(max, Math.max(min, dpi));
  return Math.floor((clamped - min) / step);
}

export function hwToDpi(sensor: Sensor, hw: number): number {
  const { min, step } = SENSOR_DPI[sensor];
  return min + hw * step;
}

export function snapDpi(sensor: Sensor, dpi: number): number {
  return hwToDpi(sensor, dpiToHw(sensor, dpi));
}

export const DpiAxis = {
  x: 1,
  y: 2,
} as const;

export type DpiAxis = (typeof DpiAxis)[keyof typeof DpiAxis];

export interface DpiStage {
  dpi: number;
  reserved: [number, number, number]; // Trailing bytes with no known meaning, read back and written unchanged
}

export async function readDpiStage(
  t: Bus,
  sensor: Sensor,
  stage: number,
  axis: DpiAxis,
): Promise<DpiStage> {
  assertRange("stage", stage, 0, MAX_DPI_STAGES - 1);

  const r = await readSub(t, Op.dpi, stage, [axis]);

  return { dpi: hwToDpi(sensor, r.le16(0)), reserved: [r.u8(2), r.u8(3), r.u8(4)] };
}

export async function writeDpiStage(
  t: Bus,
  sensor: Sensor,
  stage: number,
  axis: DpiAxis,
  { dpi, reserved }: DpiStage,
): Promise<void> {
  assertRange("stage", stage, 0, MAX_DPI_STAGES - 1);

  if (snapDpi(sensor, dpi) !== dpi) {
    throw new RangeError(`dpi ${dpi} is out of range or off-step for sensor ${hex(sensor)}`);
  }

  return t.write(Op.dpi, [stage, ...le16Bytes(dpiToHw(sensor, dpi)), ...reserved, axis]);
}
