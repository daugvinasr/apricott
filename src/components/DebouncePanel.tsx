import { MAX_DEBOUNCE_MS, MIN_DEBOUNCE_MS } from "@/core/commands";
import { debounceSetting } from "@/device/settings";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

export default function DebouncePanel() {
  const debounce = useDeviceSetting(debounceSetting);

  return (
    <SettingSection title="Debounce" description="Time a click must hold before it counts.">
      <NumberInput
        label="Debounce"
        isLabelHidden
        value={debounce.shown}
        min={MIN_DEBOUNCE_MS}
        max={MAX_DEBOUNCE_MS}
        units="ms"
        isIntegerOnly
        hasNumberSteppers
        isDisabled={debounce.isDisabled}
        onChange={debounce.set}
        width={160}
      />
      <SettingError error={debounce.error} />
    </SettingSection>
  );
}
