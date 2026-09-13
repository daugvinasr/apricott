import { type ButtonName, LiftOff, type MouseButton, Sensor } from "@/core/commands";
import { m } from "@/paraglide/messages";

export const LIFT_OFF_LABELS = {
  [LiftOff.mm07]: m.liftOff07mm(),
  [LiftOff.mm1]: m.liftOff1mm(),
  [LiftOff.mm2]: m.liftOff2mm(),
} satisfies Record<LiftOff, string>;

export const SENSOR_LABELS = {
  [Sensor.PAW3395]: "PAW3395",
  [Sensor.PAW3950]: "PAW3950",
} satisfies Record<Sensor, string>;

export function formatSeconds(s: number): string {
  return s < 60 ? m.seconds({ value: s }) : m.minutes({ value: s / 60 });
}

export const MOUSE_LABELS = {
  left: m.leftClick(),
  right: m.rightClick(),
  middle: m.middleClick(),
  back: m.back(),
  forward: m.forward(),
} satisfies Record<MouseButton, string>;

export const BUTTON_LABELS = {
  ...MOUSE_LABELS,
  dpi: m.dpiButton(),
} satisfies Record<ButtonName, string>;
