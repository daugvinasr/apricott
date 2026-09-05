import { LiftOff, Sensor } from "@/core/commands";

export const LIFT_OFF_LABELS = {
  [LiftOff.mm07]: "0.7 mm",
  [LiftOff.mm1]: "1 mm",
  [LiftOff.mm2]: "2 mm",
} satisfies Record<LiftOff, string>;

export const SENSOR_LABELS = {
  [Sensor.PAW3395]: "PAW3395",
  [Sensor.PAW3950]: "PAW3950",
} satisfies Record<Sensor, string>;

export function formatSeconds(s: number): string {
  return s < 60 ? `${s} s` : `${s / 60} min`;
}
