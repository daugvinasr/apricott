import { BUTTON_MATRIX, type ButtonAction, type ButtonName, writeButton } from "./buttons";
import { DEFAULT_DEBOUNCE_MS, writeDebounce } from "./debounce";
import { DpiAxis, type DpiStage, writeDpiStage } from "./dpi";
import type { Sensor } from "./identity";
import { LiftOff, writeLiftOff } from "./lift-off";
import { PerformanceMode, type SensorMode, writeSensorMode } from "./performance-mode";
import { type PollingRate, writePollingRate } from "./polling-rate";
import { writeMotionSync } from "./sensor";
import type { Bus } from "./shared";
import { DEFAULT_SLEEP_TIMER, type SleepTimer, writeSleepTimer } from "./sleep";
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

// SAFETY: BUTTON_MATRIX is a const object, so its keys are exactly ButtonName
const BUTTON_NAMES = Object.keys(BUTTON_MATRIX) as ButtonName[];

const DEFAULT_DPI = [400, 800, 1600, 2400, 3200, 6400];

const DEFAULT_BUTTONS = {
  left: { type: "mouse", button: "left" },
  right: { type: "mouse", button: "right" },
  middle: { type: "mouse", button: "middle" },
  back: { type: "mouse", button: "back" },
  forward: { type: "mouse", button: "forward" },
  dpi: { type: "dpi", op: "cycle" },
} satisfies Record<ButtonName, ButtonAction>;

export function factoryDefaults(): FactoryDefaults {
  return {
    pollingRate: 1000,
    dpi: DEFAULT_DPI.map((dpi) => ({ dpi, reserved: [0, 0, 0] })),
    stages: { count: 6, active: 1, dpiEffect: 1, reserved: [1, 1] },
    liftOff: LiftOff.mm1,
    motionSync: true,
    sensorMode: { performance: PerformanceMode.highPerformance, frameRateBoost: false },
    debounce: DEFAULT_DEBOUNCE_MS,
    sleepTimer: DEFAULT_SLEEP_TIMER,
    rapidFire: { repeats: 3, intervalMs: 10 },
    buttons: DEFAULT_BUTTONS,
  };
}

type Step = (t: Bus) => Promise<void>;

function resetSteps(sensor: Sensor): Step[] {
  const d = factoryDefaults();

  return [
    (t) => writePollingRate(t, d.pollingRate),
    ...[DpiAxis.x, DpiAxis.y].flatMap((axis) =>
      d.dpi.map(
        (value, stage): Step =>
          (t) =>
            writeDpiStage(t, sensor, stage, axis, value),
      ),
    ),
    (t) => writeStages(t, d.stages),
    (t) => writeLiftOff(t, d.liftOff),
    (t) => writeMotionSync(t, d.motionSync),
    (t) => writeSensorMode(t, d.sensorMode),
    (t) => writeDebounce(t, d.debounce),
    (t) => writeSleepTimer(t, d.sleepTimer),
    (t) => writeRapidFire(t, d.rapidFire),
    ...BUTTON_NAMES.map(
      (b): Step =>
        (t) =>
          writeButton(t, b, d.buttons[b]),
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
