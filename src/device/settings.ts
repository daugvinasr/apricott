import {
  type Bus,
  type LiftOff,
  type PollingRate,
  readLiftOff,
  readPollingRate,
  writeLiftOff,
  writePollingRate,
} from "../core/commands";

export interface DeviceSetting<T> {
  key: string;
  read(bus: Bus): Promise<T>;
  write(bus: Bus, value: T): Promise<void>;
}

export const pollingRate: DeviceSetting<PollingRate> = {
  key: "pollingRate",
  read: readPollingRate,
  write: writePollingRate,
};

export const liftOff: DeviceSetting<LiftOff> = {
  key: "liftOff",
  read: readLiftOff,
  write: writeLiftOff,
};
