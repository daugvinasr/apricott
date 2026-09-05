import { m } from "@/paraglide/messages";
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
    <SettingSection title={m.pollingRate()} description={m.pollingRateDescription()}>
      <ChoiceGroup
        label={m.pollingRate()}
        options={rates}
        value={polling.shown}
        format={(hz) => m.hertz({ value: hz })}
        isDisabled={polling.isDisabled}
        onChange={polling.set}
      />
      <SettingError error={polling.error} />
    </SettingSection>
  );
}
