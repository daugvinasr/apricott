import {
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

export const sensorModeSetting: DeviceSetting<SensorMode> = {
  key: "sensorMode",
  read: readSensorMode,
  write: writeSensorMode,
  equals: (a, b) => a.performance === b.performance && a.highFps === b.highFps,
};
