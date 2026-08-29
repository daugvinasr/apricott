import {
  DpiAxis,
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
} from "../core/commands";
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

export function dpiStageSetting(sensor: Sensor, stage: number): DeviceSetting<DpiStagePair> {
  return {
    key: `dpi:${stage}`,
    read: async (bus) => ({
      x: await readDpiStage(bus, sensor, stage, DpiAxis.x),
      y: await readDpiStage(bus, sensor, stage, DpiAxis.y),
    }),
    write: async (bus, { x, y }) => {
      await writeDpiStage(bus, sensor, stage, DpiAxis.x, x);
      await writeDpiStage(bus, sensor, stage, DpiAxis.y, y);
    },
    equals: (a, b) => a.x.dpi === b.x.dpi && a.y.dpi === b.y.dpi,
  };
}
