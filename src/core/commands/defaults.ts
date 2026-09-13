import { BUTTON_NAMES, type ButtonAction, type ButtonName, writeButton } from "./buttons";
import { writeDebounce } from "./debounce";
import { DpiAxis, type DpiStage, writeDpiStage } from "./dpi";
import type { Sensor } from "./identity";
import { LiftOff, writeLiftOff } from "./lift-off";
import { PerformanceMode, type SensorMode, writeSensorMode } from "./performance-mode";
import { type PollingRate, writePollingRate } from "./polling-rate";
import { writeMotionSync } from "./sensor";
import type { Bus } from "./shared";
import { type SleepTimer, writeSleepTimer } from "./sleep";
import { type StageConfig, writeStages } from "./stages";
import { type RapidFire, writeRapidFire } from "./timing";

interface FactoryDefaults {
  pollingRate: PollingRate;
  dpi: DpiStage[];
  stages: StageConfig;
  liftOff: LiftOff;
  motionSync: boolean;
  sensorMode: SensorMode;
  debounce: number;
  sleepTimer: SleepTimer;
  rapidFire: RapidFire;
  buttons: Record<ButtonName, ButtonAction>;
}

export const FACTORY_DEFAULTS: FactoryDefaults = {
  pollingRate: 1000,
  dpi: [400, 800, 1600, 2400, 3200, 6400].map((dpi) => ({ dpi, reserved: [0, 0, 0] })),
  stages: { count: 6, active: 1, dpiEffect: 1, reserved: [1, 1] },
  liftOff: LiftOff.mm1,
  motionSync: true,
  sensorMode: { performance: PerformanceMode.highPerformance, frameRateBoost: false },
  debounce: 8,
  sleepTimer: 60,
  rapidFire: { repeats: 3, intervalMs: 10 },
  buttons: {
    left: { type: "mouse", button: "left" },
    right: { type: "mouse", button: "right" },
    middle: { type: "mouse", button: "middle" },
    back: { type: "mouse", button: "back" },
    forward: { type: "mouse", button: "forward" },
    dpi: { type: "dpi", op: "cycle" },
  },
};

type Step = (t: Bus) => Promise<void>;

function resetSteps(sensor: Sensor): Step[] {
  return [
    (t) => writePollingRate(t, FACTORY_DEFAULTS.pollingRate),
    ...[DpiAxis.x, DpiAxis.y].flatMap((axis) =>
      FACTORY_DEFAULTS.dpi.map(
        (value, stage): Step =>
          (t) =>
            writeDpiStage(t, sensor, stage, axis, value),
      ),
    ),
    (t) => writeStages(t, FACTORY_DEFAULTS.stages),
    (t) => writeLiftOff(t, FACTORY_DEFAULTS.liftOff),
    (t) => writeMotionSync(t, FACTORY_DEFAULTS.motionSync),
    (t) => writeSensorMode(t, FACTORY_DEFAULTS.sensorMode),
    (t) => writeDebounce(t, FACTORY_DEFAULTS.debounce),
    (t) => writeSleepTimer(t, FACTORY_DEFAULTS.sleepTimer),
    (t) => writeRapidFire(t, FACTORY_DEFAULTS.rapidFire),
    ...BUTTON_NAMES.map(
      (b): Step =>
        (t) =>
          writeButton(t, b, FACTORY_DEFAULTS.buttons[b]),
    ),
  ];
}

export async function resetToDefaults(
  t: Bus,
  sensor: Sensor,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const steps = resetSteps(sensor);

  for (const [i, step] of steps.entries()) {
    await step(t);
    onProgress?.(i + 1, steps.length);
  }
}
