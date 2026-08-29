import { useEffect } from "react";
import { Frame } from "../core/bytes";
import { parseInputReport, type StageConfig } from "../core/commands";
import type { Device } from "./context";
import { debounceSetting, motionSyncSetting, pollingRateSetting, stagesSetting } from "./settings";

export const INPUT_REPORT_KEY = ["inputReport"];

export function useInputReports(device: Device): void {
  useEffect(() => {
    const { transport, queries } = device;

    transport.onInputReport((data) => {
      let report;
      try {
        report = parseInputReport(new Frame(data));
      } catch {
        return;
      }

      queries.setQueryData(INPUT_REPORT_KEY, report);
      queries.setQueryData<StageConfig>([stagesSetting.key], (prev) =>
        prev && prev.active !== report.activeStage ? { ...prev, active: report.activeStage } : prev,
      );
      queries.setQueryData([pollingRateSetting.key], report.pollingRateHz);
      queries.setQueryData([debounceSetting.key], report.debounceMs);
      queries.setQueryData([motionSyncSetting.key], report.motionSync);
    });

    return () => transport.onInputReport(null);
  }, [device]);
}
