import { isHighPollingRate, PerformanceMode, Sensor } from "@/core/commands";
import { pollingRateSetting, performanceModeSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceBusy, useDeviceSetting } from "@/device/useDeviceSetting";
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

export default function PerformanceModePanel() {
  const { identity } = useConnectedDevice();
  const mode = useDeviceSetting(performanceModeSetting);
  const polling = useDeviceSetting(pollingRateSetting);
  const busy = useDeviceBusy();

  // Over 1k the device is is always in wired performance mode
  const highPollingRate = polling.value !== undefined && isHighPollingRate(polling.value);
  const current = mode.value;
  const shownPerformance = highPollingRate ? PerformanceMode.wired : current?.performance;
  const supportsFrameRateBoost = identity.sensor === Sensor.PAW3950;
  const canToggleFrameRateBoost =
    supportsFrameRateBoost && current?.performance === PerformanceMode.wired;

  return (
    <div>
      <p>Performance mode</p>
      <div role="radiogroup">
        {Object.values(PerformanceMode).map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={v === shownPerformance}
            disabled={busy || highPollingRate || current === undefined}
            onClick={() =>
              current &&
              mode.set({
                performance: v,
                frameRateBoost: v === PerformanceMode.wired && current.frameRateBoost,
              })
            }
            {...stylex.props(v === shownPerformance && colorStyles.active)}
          >
            {PERFORMANCE_LABELS[v]}
          </button>
        ))}
      </div>
      {supportsFrameRateBoost && (
        <label>
          <input
            type="checkbox"
            checked={current?.frameRateBoost ?? false}
            disabled={busy || !canToggleFrameRateBoost}
            onChange={(e) => current && mode.set({ ...current, frameRateBoost: e.target.checked })}
          />
          High FPS
        </label>
      )}
      {mode.error && <p role="alert">{mode.error.message}</p>}
    </div>
  );
}
