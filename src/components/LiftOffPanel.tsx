import { m } from "@/paraglide/messages";
import { supportedLiftOffs } from "@/core/commands";
import { liftOffSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import ChoiceGroup from "./ChoiceGroup";
import { LIFT_OFF_LABELS } from "./labels";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

export default function LiftOffPanel() {
  const { identity } = useConnectedDevice();
  const liftOff = useDeviceSetting(liftOffSetting);

  return (
    <SettingSection title={m.liftOffDistance()} description={m.liftOffDistanceDescription()}>
      <ChoiceGroup
        label={m.liftOffDistance()}
        options={supportedLiftOffs(identity.sensor)}
        value={liftOff.shown}
        format={(v) => LIFT_OFF_LABELS[v]}
        isDisabled={liftOff.isDisabled}
        onChange={liftOff.set}
      />
      <SettingError error={liftOff.error} />
    </SettingSection>
  );
}
