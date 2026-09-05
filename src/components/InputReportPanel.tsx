import { useInputReport } from "@/device/inputReports";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { LIFT_OFF_LABELS } from "./labels";

export default function InputReportPanel() {
  const report = useInputReport();

  if (!report) {
    return <Text color="secondary">Waiting for the mouse to report in…</Text>;
  }

  return (
    <MetadataList label={{ position: "start", width: 120 }}>
      <MetadataListItem label="Battery">
        {report.batteryPercent}%{report.charging ? ", charging" : ""}
      </MetadataListItem>
      <MetadataListItem label="Polling rate">{report.pollingRateHz} Hz</MetadataListItem>
      <MetadataListItem label="DPI stage">{report.activeStage + 1}</MetadataListItem>
      <MetadataListItem label="Debounce">{report.debounceMs} ms</MetadataListItem>
      <MetadataListItem label="Motion sync">{report.motionSync ? "On" : "Off"}</MetadataListItem>
      <MetadataListItem label="Lift-off">
        {report.liftOff === undefined ? "Unknown" : LIFT_OFF_LABELS[report.liftOff]}
      </MetadataListItem>
    </MetadataList>
  );
}
