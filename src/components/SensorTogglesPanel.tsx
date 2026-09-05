import { angleSnappingSetting, motionSyncSetting, rippleControlSetting } from "@/device/settings";
import { type DeviceSetting, useDeviceSetting } from "@/device/useDeviceSetting";
import { Switch } from "@astryxdesign/core/Switch";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

function Toggle({ label, setting }: { label: string; setting: DeviceSetting<boolean> }) {
  const flag = useDeviceSetting(setting);

  return (
    <>
      <Switch
        label={label}
        value={flag.shown ?? false}
        isDisabled={flag.isDisabled}
        onChange={(checked) => flag.set(checked)}
      />
      <SettingError error={flag.error} />
    </>
  );
}

export default function SensorTogglesPanel() {
  return (
    <SettingSection title="Sensor" description="Tracking filters applied in firmware.">
      <Toggle label="Angle snapping" setting={angleSnappingSetting} />
      <Toggle label="Motion sync" setting={motionSyncSetting} />
      <Toggle label="Ripple control" setting={rippleControlSetting} />
    </SettingSection>
  );
}
