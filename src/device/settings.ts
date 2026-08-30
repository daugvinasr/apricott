import {
  DpiAxis,
  MAX_DPI_STAGES,
  type DpiStage,
  readDpiStage,
  readStages,
  type Sensor,
  type StageConfig,
  writeDpiStage,
  writeStages,
  readAngleSnapping,
  readMotionSync,
  readRippleControl,
  writeAngleSnapping,
  writeMotionSync,
  writeRippleControl,
  readSensorMode,
  writeSensorMode,
  type SensorMode,
  readDebounce,
  writeDebounce,
  readLiftOff,
  readPollingRate,
  readSleepTimer,
  writeLiftOff,
  writePollingRate,
  writeSleepTimer,
  type LiftOff,
  type PollingRate,
  type SleepTimer,
  type ButtonAction,
  type ButtonName,
  encodeAction,
  readButton,
  writeButton,
} from "@/core/commands";
import type { Bus } from "@/core/commands";
import type { DeviceSetting } from "./useDeviceSetting";

export const liftOffSetting: DeviceSetting<LiftOff> = {
  key: "liftOff",
  read: readLiftOff,
  write: writeLiftOff,
};

export const pollingRateSetting: DeviceSetting<PollingRate> = {
  key: "pollingRate",
  read: readPollingRate,
  write: writePollingRate,
};

export const sleepTimerSetting: DeviceSetting<SleepTimer> = {
  key: "sleepTimer",
  read: readSleepTimer,
  write: writeSleepTimer,
};

export const debounceSetting: DeviceSetting<number> = {
  key: "debounce",
  read: readDebounce,
  write: writeDebounce,
};

export const performanceModeSetting: DeviceSetting<SensorMode> = {
  key: "performanceMode",
  read: readSensorMode,
  write: writeSensorMode,
  equals: (a, b) => a.performance === b.performance && a.highFps === b.highFps,
};

export const angleSnappingSetting: DeviceSetting<boolean> = {
  key: "angleSnapping",
  read: readAngleSnapping,
  write: writeAngleSnapping,
};

export const motionSyncSetting: DeviceSetting<boolean> = {
  key: "motionSync",
  read: readMotionSync,
  write: writeMotionSync,
};

export const rippleControlSetting: DeviceSetting<boolean> = {
  key: "rippleControl",
  read: readRippleControl,
  write: writeRippleControl,
};

export const stagesSetting: DeviceSetting<StageConfig> = {
  key: "stages",
  read: readStages,
  write: writeStages,
  equals: (a, b) => a.count === b.count && a.active === b.active && a.dpiEffect === b.dpiEffect,
};

export interface DpiStagePair {
  x: DpiStage;
  y: DpiStage;
}

const STAGE_INDICES = Array.from({ length: MAX_DPI_STAGES }, (_, i) => i);

async function readPair(bus: Bus, sensor: Sensor, stage: number): Promise<DpiStagePair> {
  return {
    x: await readDpiStage(bus, sensor, stage, DpiAxis.x),
    y: await readDpiStage(bus, sensor, stage, DpiAxis.y),
  };
}

export function dpiStagesSetting(sensor: Sensor): DeviceSetting<DpiStagePair[]> {
  const writeAxis = (bus: Bus, stage: number, axis: DpiAxis, value: DpiStage) =>
    writeDpiStage(bus, sensor, stage, axis, value);

  return {
    key: "dpi",
    read: async (bus) => {
      const pairs: DpiStagePair[] = [];

      for (const stage of STAGE_INDICES) {
        pairs.push(await readPair(bus, sensor, stage));
      }

      return pairs;
    },
    write: async (bus, pairs) => {
      for (const [stage, { x, y }] of pairs.entries()) {
        await writeAxis(bus, stage, DpiAxis.x, x);
        await writeAxis(bus, stage, DpiAxis.y, y);
      }
    },
    update: async (bus, next, prev) => {
      const result = [...prev];
      for (const [stage, pair] of next.entries()) {
        const before = prev[stage];

        if (!before) {
          continue;
        }

        let after = before;

        for (const [axis, key] of [
          [DpiAxis.x, "x"],
          [DpiAxis.y, "y"],
        ] as const) {
          if (pair[key].dpi === before[key].dpi) {
            continue;
          }

          await writeAxis(bus, stage, axis, pair[key]);
          after = { ...after, [key]: await readDpiStage(bus, sensor, stage, axis) };
        }
        result[stage] = after;
      }
      return result;
    },
    equals: (a, b) =>
      a.length === b.length &&
      a.every((p, i) => p.x.dpi === b[i]?.x.dpi && p.y.dpi === b[i]?.y.dpi),
  };
}

export function buttonSetting(button: ButtonName): DeviceSetting<ButtonAction> {
  return {
    key: `button:${button}`,
    read: (bus) => readButton(bus, button),
    write: (bus, action) => writeButton(bus, button, action),
    equals: (a, b) => encodeAction(a) === encodeAction(b),
  };
}
