import { SLEEP_TIMERS } from "@/core/commands";
import { sleepTimerSetting } from "@/device/settings";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { Selector } from "@astryxdesign/core/Selector";
import { pickChoice } from "./choice";
import { formatSeconds } from "./labels";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

const OPTIONS = SLEEP_TIMERS.map((s) => ({ value: String(s), label: formatSeconds(s) }));

export default function SleepTimerPanel() {
  const sleep = useDeviceSetting(sleepTimerSetting);

  return (
    <SettingSection title="Sleep timer" description="Idle time before the mouse goes to sleep.">
      <Selector
        label="Sleep timer"
        isLabelHidden
        options={OPTIONS}
        value={sleep.shown === undefined ? undefined : String(sleep.shown)}
        isDisabled={sleep.isDisabled}
        onChange={(v) => {
          const seconds = pickChoice(SLEEP_TIMERS, v);
          if (seconds !== undefined) sleep.set(seconds);
        }}
        width={160}
      />
      <SettingError error={sleep.error} />
    </SettingSection>
  );
}
