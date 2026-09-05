import { m } from "@/paraglide/messages";
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
    <SettingSection title={m.sensor()} description={m.sensorDescription()}>
      <Toggle label={m.angleSnapping()} setting={angleSnappingSetting} />
      <Toggle label={m.motionSync()} setting={motionSyncSetting} />
      <Toggle label={m.rippleControl()} setting={rippleControlSetting} />
    </SettingSection>
  );
}
