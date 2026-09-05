import { supportedPollingRates } from "@/core/commands";
import { pollingRateSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import ChoiceGroup from "./ChoiceGroup";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

export default function PollingRatePanel() {
  const { identity } = useConnectedDevice();
  const polling = useDeviceSetting(pollingRateSetting);
  const rates = [...supportedPollingRates(identity.link)].sort((a, b) => a - b);

  return (
    <SettingSection title="Polling rate" description="How often the mouse reports to the computer.">
      <ChoiceGroup
        label="Polling rate"
        options={rates}
        value={polling.shown}
        format={(hz) => `${hz} Hz`}
        isDisabled={polling.isDisabled}
        onChange={polling.set}
      />
      <SettingError error={polling.error} />
    </SettingSection>
  );
}
