import { useEffect } from "react";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import { Frame } from "../core/bytes";
import { type InputReport, parseInputReport } from "../core/commands";
import type { Device } from "./context";
import type { DeviceSetting } from "./useDeviceSetting";
import { debounceSetting, motionSyncSetting, pollingRateSetting, stagesSetting } from "./settings";

const INPUT_REPORT_KEY = ["inputReport"];

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

export function useInputReports(device: Device): void {
  useEffect(() => {
    const { transport, queries } = device;

    transport.onInputReport((data) => {
      let report: InputReport;
      try {
        report = parseInputReport(new Frame(data));
      } catch {
        return;
      }

      queries.setQueryData(INPUT_REPORT_KEY, report);
      for (const apply of MIRRORS) apply(queries, report);
    });

    return () => transport.onInputReport(null);
  }, [device]);
}

export function useInputReport(): InputReport | undefined {
  return useQuery<InputReport>({ queryKey: INPUT_REPORT_KEY, enabled: false }).data;
}
