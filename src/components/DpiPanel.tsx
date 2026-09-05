import { MAX_DPI_STAGES, SENSOR_DPI, STAGE_INDICES, type Sensor, snapDpi } from "@/core/commands";
import { type DpiStagePair, dpiStagesSetting, stagesSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Slider } from "@astryxdesign/core/Slider";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Switch } from "@astryxdesign/core/Switch";
import { useState } from "react";
import ChoiceGroup from "./ChoiceGroup";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

function withDpi(pair: DpiStagePair, x: number, y: number): DpiStagePair {
  return { x: { ...pair.x, dpi: x }, y: { ...pair.y, dpi: y } };
}

function DpiSlider({
  label,
  sensor,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  sensor: Sensor;
  value: number;
  disabled: boolean;
  onCommit: (dpi: number) => void;
}) {
  const { min, max, step } = SENSOR_DPI[sensor];
  const [draft, setDraft] = useState<number>();

  return (
    <Slider
      label={label}
      min={min}
      max={max}
      step={step}
      value={draft ?? value}
      valueDisplay="text"
      isDisabled={disabled}
      onChange={(v: number) => setDraft(snapDpi(sensor, v))}
      onChangeEnd={(v: number) => {
        const dpi = snapDpi(sensor, v);
        setDraft(undefined);
        if (dpi !== value) onCommit(dpi);
      }}
      width="100%"
    />
  );
}

function DpiStageRow({
  sensor,
  stage,
  pair,
  separateXY,
  disabled,
  onChange,
}: {
  sensor: Sensor;
  stage: number;
  pair: DpiStagePair;
  separateXY: boolean;
  disabled: boolean;
  onChange: (pair: DpiStagePair) => void;
}) {
  const name = `Stage ${stage + 1}`;

  if (!separateXY) {
    return (
      <DpiSlider
        label={name}
        sensor={sensor}
        value={pair.x.dpi}
        disabled={disabled}
        onCommit={(dpi) => onChange(withDpi(pair, dpi, dpi))}
      />
    );
  }

  return (
    <HStack gap={4}>
      <DpiSlider
        label={`${name} X`}
        sensor={sensor}
        value={pair.x.dpi}
        disabled={disabled}
        onCommit={(dpi) => onChange(withDpi(pair, dpi, pair.y.dpi))}
      />
      <DpiSlider
        label={`${name} Y`}
        sensor={sensor}
        value={pair.y.dpi}
        disabled={disabled}
        onCommit={(dpi) => onChange(withDpi(pair, pair.x.dpi, dpi))}
      />
    </HStack>
  );
}

export default function DpiPanel() {
  const { identity } = useConnectedDevice();
  const stages = useDeviceSetting(stagesSetting);
  const dpi = useDeviceSetting(dpiStagesSetting(identity.sensor));

  const [forceSeparate, setForceSeparate] = useState(false);

  const cfg = stages.shown;
  const pairs = dpi.shown ?? [];

  const anyDiffers = pairs.some((p) => p.x.dpi !== p.y.dpi);
  const separateXY = forceSeparate || anyDiffers;

  const setPair = (stage: number, next: DpiStagePair) =>
    dpi.set(pairs.map((p, i) => (i === stage ? next : p)));

  const syncXY = () => dpi.set(pairs.map((p) => withDpi(p, p.x.dpi, p.x.dpi)));

  return (
    <SettingSection
      title="DPI"
      description="Sensitivity stages you cycle through with the DPI button."
    >
      <HStack gap={4} align="end">
        <NumberInput
          label="Stages"
          value={cfg?.count}
          min={1}
          max={MAX_DPI_STAGES}
          isIntegerOnly
          hasNumberSteppers
          isDisabled={stages.isDisabled}
          onChange={(count) =>
            cfg && stages.set({ ...cfg, count, active: Math.min(cfg.active, count - 1) })
          }
          width={140}
        />
        <Switch
          label="Adjust X/Y separately"
          value={separateXY}
          isDisabled={dpi.isDisabled}
          onChange={(checked) => {
            setForceSeparate(checked);
            if (!checked && anyDiffers) syncXY();
          }}
        />
      </HStack>
      {cfg && (
        <VStack gap={3}>
          <ChoiceGroup
            label="Active stage"
            options={STAGE_INDICES.slice(0, cfg.count)}
            value={cfg.active}
            format={(i) => `Stage ${i + 1}`}
            isDisabled={stages.isDisabled}
            onChange={(active) => stages.set({ ...cfg, active })}
          />
          {pairs.slice(0, cfg.count).map((pair, i) => (
            <DpiStageRow
              key={i}
              sensor={identity.sensor}
              stage={i}
              pair={pair}
              separateXY={separateXY}
              disabled={dpi.isDisabled}
              onChange={(next) => setPair(i, next)}
            />
          ))}
        </VStack>
      )}
      <SettingError error={stages.error} />
      <SettingError error={dpi.error} />
    </SettingSection>
  );
}
