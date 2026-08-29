import { angleSnappingSetting, motionSyncSetting, rippleControlSetting } from "../device/settings";
import { type DeviceSetting, useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";

function Toggle({ label, setting }: { label: string; setting: DeviceSetting<boolean> }) {
  const flag = useDeviceSetting(setting);
  const busy = useDeviceBusy();

  return (
    <div>
      <label>
        <input
          type="checkbox"
          role="switch"
          aria-checked={flag.value ?? false}
          checked={flag.value ?? false}
          disabled={busy || flag.value === undefined}
          onChange={(e) => flag.set(e.target.checked)}
        />
        {label}
      </label>
      {flag.error && <p role="alert">{flag.error.message}</p>}
    </div>
  );
}

export default function SensorTogglesPanel() {
  return (
    <div>
      <p>Sensor</p>
      <Toggle label="Angle snapping" setting={angleSnappingSetting} />
      <Toggle label="Motion sync" setting={motionSyncSetting} />
      <Toggle label="Ripple control" setting={rippleControlSetting} />
    </div>
  );
}
