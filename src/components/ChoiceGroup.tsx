import { ToggleButton, ToggleButtonGroup } from "@astryxdesign/core/ToggleButton";
import { pickChoice } from "./choice";

export default function ChoiceGroup<T extends number>({
  label,
  options,
  value,
  format,
  isDisabled,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  format: (option: T) => string;
  isDisabled: boolean;
  onChange: (option: T) => void;
}) {
  return (
    <ToggleButtonGroup
      type="single"
      label={label}
      value={value === undefined ? null : String(value)}
      isDisabled={isDisabled}
      onChange={(v) => {
        const next = pickChoice(options, v);
        if (next !== undefined) onChange(next);
      }}
    >
      {options.map((o) => (
        <ToggleButton key={o} value={String(o)} label={format(o)} />
      ))}
    </ToggleButtonGroup>
  );
}
