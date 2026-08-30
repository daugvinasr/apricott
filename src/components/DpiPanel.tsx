import { MAX_DPI_STAGES, SENSOR_DPI, type Sensor, snapDpi } from "@/core/commands";
import { type DpiStagePair, dpiStagesSetting, stagesSetting } from "@/device/settings";
import { useConnectedDevice } from "@/device/context";
import { useDeviceBusy, useDeviceSetting } from "@/device/useDeviceSetting";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    minWidth: "6ch",
    textAlign: "center",
  },
  slider: {
    flex: 1,
  },
  axes: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: 4,
  },
  active: {
    backgroundColor: "orange",
  },
});

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
  const shown = draft ?? value;

  const commit = () => {
    if (draft === undefined) return;
    setDraft(undefined);
    if (draft !== value) onCommit(draft);
  };

  return (
    <>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={shown}
        disabled={disabled}
        onChange={(e) => setDraft(snapDpi(sensor, Number(e.target.value)))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        {...stylex.props(styles.slider)}
      />
      <span {...stylex.props(styles.amount)}>{shown}</span>
    </>
  );
}

function DpiStageRow({
  sensor,
  stage,
  pair,
  isActive,
  separateXY,
  disabled,
  onActivate,
  onChange,
}: {
  sensor: Sensor;
  stage: number;
  pair: DpiStagePair;
  isActive: boolean;
  separateXY: boolean;
  disabled: boolean;
  onActivate: () => void;
  onChange: (pair: DpiStagePair) => void;
}) {
  const name = `Stage ${stage + 1}`;
  const slider = (label: string, value: number, onCommit: (dpi: number) => void) => (
    <DpiSlider
      label={`${name} ${label}`}
      sensor={sensor}
      value={value}
      disabled={disabled}
      onCommit={onCommit}
    />
  );

  return (
    <div {...stylex.props(styles.row)}>
      <button
        role="radio"
        aria-checked={isActive}
        aria-label={name}
        disabled={disabled}
        onClick={onActivate}
        {...stylex.props(isActive && styles.active)}
      >
        {stage + 1}
      </button>
      {separateXY ? (
        <div {...stylex.props(styles.axes)}>
          <div {...stylex.props(styles.row)}>
            <span>X</span>
            {slider("X DPI", pair.x.dpi, (dpi) => onChange(withDpi(pair, dpi, pair.y.dpi)))}
          </div>
          <div {...stylex.props(styles.row)}>
            <span>Y</span>
            {slider("Y DPI", pair.y.dpi, (dpi) => onChange(withDpi(pair, pair.x.dpi, dpi)))}
          </div>
        </div>
      ) : (
        slider("DPI", pair.x.dpi, (dpi) => onChange(withDpi(pair, dpi, dpi)))
      )}
    </div>
  );
}

export default function DpiPanel() {
  const { identity } = useConnectedDevice();
  const stages = useDeviceSetting(stagesSetting);
  const dpi = useDeviceSetting(dpiStagesSetting(identity.sensor));
  const busy = useDeviceBusy();

  const [forceSeparate, setForceSeparate] = useState(false);

  const cfg = stages.pending ?? stages.value;
  const pairs = dpi.pending ?? dpi.value;

  const anyDiffers = pairs?.some((p) => p.x.dpi !== p.y.dpi) ?? false;
  const separateXY = forceSeparate || anyDiffers;

  const setPair = (stage: number, next: DpiStagePair) =>
    pairs && dpi.set(pairs.map((p, i) => (i === stage ? next : p)));

  const syncXY = () => pairs && dpi.set(pairs.map((p) => withDpi(p, p.x.dpi, p.x.dpi)));

  return (
    <div>
      <p>DPI</p>
      <label>
        <input
          type="checkbox"
          checked={separateXY}
          disabled={busy}
          onChange={(e) => {
            setForceSeparate(e.target.checked);
            if (!e.target.checked && anyDiffers) syncXY();
          }}
        />
        Adjust X/Y separately
      </label>
      <div {...stylex.props(styles.row)}>
        <span>Stages</span>
        <button
          aria-label="Remove stage"
          disabled={busy || !cfg || cfg.count <= 1}
          onClick={() =>
            cfg &&
            stages.set({
              ...cfg,
              count: cfg.count - 1,
              active: Math.min(cfg.active, cfg.count - 2),
            })
          }
        >
          −
        </button>
        <span {...stylex.props(styles.amount)}>{cfg?.count ?? ""}</span>
        <button
          aria-label="Add stage"
          disabled={busy || !cfg || cfg.count >= MAX_DPI_STAGES}
          onClick={() => cfg && stages.set({ ...cfg, count: cfg.count + 1 })}
        >
          +
        </button>
      </div>
      <div role="radiogroup" aria-label="Active stage">
        {cfg &&
          pairs
            ?.slice(0, cfg.count)
            .map((pair, i) => (
              <DpiStageRow
                key={i}
                sensor={identity.sensor}
                stage={i}
                pair={pair}
                isActive={i === cfg.active}
                separateXY={separateXY}
                disabled={busy}
                onActivate={() => stages.set({ ...cfg, active: i })}
                onChange={(next) => setPair(i, next)}
              />
            ))}
      </div>
      {stages.error && <p role="alert">{stages.error.message}</p>}
      {dpi.error && <p role="alert">{dpi.error.message}</p>}
    </div>
  );
}
