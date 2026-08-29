import {
  readLiftOff,
  readPollingRate,
  writeLiftOff,
  writePollingRate,
  type LiftOff,
  type PollingRate,
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
