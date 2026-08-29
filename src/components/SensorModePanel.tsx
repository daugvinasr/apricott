import { PerformanceMode, Sensor } from "../core/commands";
import { sensorModeSetting } from "../device/settings";
import { useConnectedDevice } from "../device/context";
import { useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";
import * as stylex from "@stylexjs/stylex";

const colorStyles = stylex.create({
  active: {
    backgroundColor: "orange",
  },
});

const PERFORMANCE_LABELS = {
  [PerformanceMode.lowPower]: "Low power",
  [PerformanceMode.highPerformance]: "High performance",
  [PerformanceMode.wired]: "Wired",
} satisfies Record<PerformanceMode, string>;

export default function SensorModePanel() {
  const { identity } = useConnectedDevice();
  const mode = useDeviceSetting(sensorModeSetting);
  const busy = useDeviceBusy();

  const current = mode.value;
  const canHighFps =
    identity.sensor === Sensor.PAW3950 && current?.performance === PerformanceMode.wired;

  return (
    <div>
      <p>Performance mode</p>
      <div role="radiogroup">
        {Object.values(PerformanceMode).map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={v === current?.performance}
            disabled={busy || current === undefined}
            onClick={() =>
              current &&
              mode.set({ performance: v, highFps: v === PerformanceMode.wired && current.highFps })
            }
            {...stylex.props(v === current?.performance && colorStyles.active)}
          >
            {PERFORMANCE_LABELS[v]}
          </button>
        ))}
      </div>
      <label>
        <input
          type="checkbox"
          checked={current?.highFps ?? false}
          disabled={busy || !canHighFps}
          onChange={(e) => current && mode.set({ ...current, highFps: e.target.checked })}
        />
        High FPS
      </label>
      {mode.error && <p role="alert">{mode.error.message}</p>}
    </div>
  );
}
