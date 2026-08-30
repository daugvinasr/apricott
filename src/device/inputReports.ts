import { useSyncExternalStore } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { Frame } from "@/core/bytes";
import { type InputReport, parseInputReport } from "@/core/commands";
import type { Transport } from "@/core/transport";
import { useConnectedDevice } from "./context";
import type { DeviceSetting } from "./useDeviceSetting";
import { debounceSetting, motionSyncSetting, pollingRateSetting, stagesSetting } from "./settings";

export interface InputReportStore {
  get: () => InputReport | undefined;
  subscribe: (listener: () => void) => () => void;
}

function mirror<T>(setting: DeviceSetting<T>, next: (report: InputReport, prev: T) => T) {
  return (queries: QueryClient, report: InputReport) =>
    queries.setQueryData<T>([setting.key], (prev) =>
      prev === undefined ? prev : next(report, prev),
    );
}

const MIRRORS = [
  mirror(pollingRateSetting, (r) => r.pollingRateHz),
  mirror(debounceSetting, (r) => r.debounceMs),
  mirror(motionSyncSetting, (r) => r.motionSync),
  mirror(stagesSetting, (r, prev) => ({ ...prev, active: r.activeStage })),
];

export function wireInputReports(transport: Transport, queries: QueryClient): InputReportStore {
  let current: InputReport | undefined;
  const listeners = new Set<() => void>();

  transport.onInputReport((data) => {
    try {
      current = parseInputReport(new Frame(data));
    } catch {
      return;
    }

    for (const listener of listeners) listener();
    for (const apply of MIRRORS) apply(queries, current);
  });

  return {
    get: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useInputReport(): InputReport | undefined {
  const { inputReports } = useConnectedDevice();
  return useSyncExternalStore(inputReports.subscribe, inputReports.get);
}
