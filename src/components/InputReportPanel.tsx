import { m } from "@/paraglide/messages";
import { useInputReport } from "@/device/inputReports";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { LIFT_OFF_LABELS } from "./labels";

export default function InputReportPanel() {
  const report = useInputReport();

  if (!report) {
    return <Text color="secondary">{m.waitingForReport()}</Text>;
  }

  return (
    <MetadataList label={{ position: "start", width: 120 }}>
      <MetadataListItem label={m.battery()}>
        {report.charging
          ? m.batteryLevelCharging({ percent: report.batteryPercent })
          : m.batteryLevel({ percent: report.batteryPercent })}
      </MetadataListItem>
      <MetadataListItem label={m.pollingRate()}>
        {m.hertz({ value: report.pollingRateHz })}
      </MetadataListItem>
      <MetadataListItem label={m.dpiStage()}>{report.activeStage + 1}</MetadataListItem>
      <MetadataListItem label={m.debounce()}>
        {m.milliseconds({ value: report.debounceMs })}
      </MetadataListItem>
      <MetadataListItem label={m.motionSync()}>
        {report.motionSync ? m.on() : m.off()}
      </MetadataListItem>
      <MetadataListItem label={m.liftOff()}>
        {report.liftOff === undefined ? m.unknown() : LIFT_OFF_LABELS[report.liftOff]}
      </MetadataListItem>
    </MetadataList>
  );
}
