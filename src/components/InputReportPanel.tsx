import { useInputReport } from "@/device/useInputReports";

export default function InputReportPanel() {
  const report = useInputReport();

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
