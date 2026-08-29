import { useQuery } from "@tanstack/react-query";
import { INPUT_REPORT_KEY } from "../device/useInputReports";
import type { InputReport } from "../core/commands";

export default function InputReportPanel() {
  const report = useQuery<InputReport>({ queryKey: INPUT_REPORT_KEY, enabled: false }).data;

  if (!report) {
    return (
      <div>
        <p>Status</p>
        <p>Waiting for input report…</p>
      </div>
    );
  }

  return (
    <div>
      <p>Status</p>
      <dl>
        <dt>Battery</dt>
        <dd>
          {report.batteryPercent}%{report.charging ? " (charging)" : ""}
        </dd>
        <dt>Polling rate</dt>
        <dd>{report.pollingRateHz} Hz</dd>
        <dt>Active stage</dt>
        <dd>{report.activeStage + 1}</dd>
        <dt>Active profile</dt>
        <dd>{report.activeProfile + 1}</dd>
        <dt>Debounce</dt>
        <dd>{report.debounceMs} ms</dd>
        <dt>Motion sync</dt>
        <dd>{report.motionSync ? "On" : "Off"}</dd>
        <dt>LOD</dt>
        <dd>{report.lodValue}</dd>
      </dl>
    </div>
  );
}
