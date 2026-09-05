import { isHighPollingRate, PerformanceMode, Sensor } from "@/core/commands";
import { pollingRateSetting, performanceModeSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Switch } from "@astryxdesign/core/Switch";
import { pickChoice } from "./choice";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

const PERFORMANCE_OPTIONS = {
  [PerformanceMode.lowPower]: { label: "Low power", description: "Longest battery life" },
  [PerformanceMode.highPerformance]: {
    label: "High performance",
    description: "Lower latency, moderate battery use",
  },
  [PerformanceMode.wired]: {
    label: "Maximum performance",
    description: "Lowest latency, highest battery use",
  },
} satisfies Record<PerformanceMode, { label: string; description: string }>;

const PERFORMANCE_MODES = Object.values(PerformanceMode);

export default function PerformanceModePanel() {
  const { identity } = useConnectedDevice();
  const mode = useDeviceSetting(performanceModeSetting);
  const polling = useDeviceSetting(pollingRateSetting);

  // Over 1k the device is always in wired performance mode
  const highPollingRate = polling.value !== undefined && isHighPollingRate(polling.value);
  const current = mode.shown;
  const shownPerformance = highPollingRate ? PerformanceMode.wired : current?.performance;
  const supportsFrameRateBoost = identity.sensor === Sensor.PAW3950;
  const canToggleFrameRateBoost =
    supportsFrameRateBoost && current?.performance === PerformanceMode.wired;

  return (
    <SettingSection title="Performance mode" description="Trade battery life for lower latency.">
      <RadioList
        label="Performance mode"
        isLabelHidden
        value={shownPerformance === undefined ? "" : String(shownPerformance)}
        isDisabled={mode.isDisabled || highPollingRate}
        disabledMessage={
          highPollingRate ? "Polling rates above 1000 Hz force wired mode" : undefined
        }
        onChange={(v) => {
          const performance = pickChoice(PERFORMANCE_MODES, v);
          if (current && performance !== undefined) {
            mode.set({ performance, frameRateBoost: current.frameRateBoost });
          }
        }}
      >
        {PERFORMANCE_MODES.map((v) => (
          <RadioListItem key={v} value={String(v)} {...PERFORMANCE_OPTIONS[v]} />
        ))}
      </RadioList>
      {supportsFrameRateBoost && (
        <Switch
          label="High FPS"
          value={current?.frameRateBoost ?? false}
          isDisabled={mode.isDisabled || !canToggleFrameRateBoost}
          disabledMessage={canToggleFrameRateBoost ? undefined : "Only available in wired mode"}
          onChange={(checked) => current && mode.set({ ...current, frameRateBoost: checked })}
        />
      )}
      <SettingError error={mode.error} />
    </SettingSection>
  );
}
