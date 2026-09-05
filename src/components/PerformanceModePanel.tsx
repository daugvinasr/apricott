import { m } from "@/paraglide/messages";
import { isHighPollingRate, PerformanceMode, Sensor } from "@/core/commands";
import { pollingRateSetting, performanceModeSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Switch } from "@astryxdesign/core/Switch";
import { pickChoice } from "./choice";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

function performanceOption(mode: PerformanceMode) {
  switch (mode) {
    case PerformanceMode.lowPower:
      return { label: m.lowPower(), description: m.lowPowerDescription() };
    case PerformanceMode.highPerformance:
      return { label: m.highPerformance(), description: m.highPerformanceDescription() };
    case PerformanceMode.wired:
      return { label: m.maximumPerformance(), description: m.maximumPerformanceDescription() };
  }
}

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
    <SettingSection title={m.performanceMode()} description={m.performanceModeDescription()}>
      <RadioList
        label={m.performanceMode()}
        isLabelHidden
        value={shownPerformance === undefined ? "" : String(shownPerformance)}
        isDisabled={mode.isDisabled || highPollingRate}
        disabledMessage={highPollingRate ? m.highPollingForcesWired() : undefined}
        onChange={(v) => {
          const performance = pickChoice(PERFORMANCE_MODES, v);
          if (current && performance !== undefined) {
            mode.set({ performance, frameRateBoost: current.frameRateBoost });
          }
        }}
      >
        {PERFORMANCE_MODES.map((v) => (
          <RadioListItem key={v} value={String(v)} {...performanceOption(v)} />
        ))}
      </RadioList>
      {supportsFrameRateBoost && (
        <Switch
          label={m.highFps()}
          value={current?.frameRateBoost ?? false}
          isDisabled={mode.isDisabled || !canToggleFrameRateBoost}
          disabledMessage={canToggleFrameRateBoost ? undefined : m.onlyInWiredMode()}
          onChange={(checked) => current && mode.set({ ...current, frameRateBoost: checked })}
        />
      )}
      <SettingError error={mode.error} />
    </SettingSection>
  );
}
