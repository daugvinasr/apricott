import { MAX_DPI_STAGES, SENSOR_DPI, type Sensor, snapDpi } from "../core/commands";
import { dpiStageSetting, stagesSetting } from "../device/settings";
import { useConnectedDevice } from "../device/context";
import { useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";
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

function DpiSlider({
  label,
  sensor,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  sensor: Sensor;
  value: number | undefined;
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
        value={shown ?? min}
        disabled={disabled || value === undefined}
        onChange={(e) => setDraft(snapDpi(sensor, Number(e.target.value)))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        {...stylex.props(styles.slider)}
      />
      <span {...stylex.props(styles.amount)}>{shown ?? ""}</span>
    </>
  );
}

function DpiStageRow({
  sensor,
  stage,
  isActive,
  separateXY,
  onActivate,
}: {
  sensor: Sensor;
  stage: number;
  isActive: boolean;
  separateXY: boolean;
  onActivate: () => void;
}) {
  const setting = dpiStageSetting(sensor, stage);
  const pair = useDeviceSetting(setting);
  const busy = useDeviceBusy();

  const current = pair.pending ?? pair.value;
  const name = `Stage ${stage + 1}`;

  const setBoth = (dpi: number) =>
    current && pair.set({ x: { ...current.x, dpi }, y: { ...current.y, dpi } });
  const setX = (dpi: number) => current && pair.set({ ...current, x: { ...current.x, dpi } });
  const setY = (dpi: number) => current && pair.set({ ...current, y: { ...current.y, dpi } });

  return (
    <div>
      <div {...stylex.props(styles.row)}>
        <button
          role="radio"
          aria-checked={isActive}
          aria-label={name}
          disabled={busy}
          onClick={onActivate}
          {...stylex.props(isActive && styles.active)}
        >
          {stage + 1}
        </button>
        {separateXY ? (
          <div {...stylex.props(styles.axes)}>
            <div {...stylex.props(styles.row)}>
              <span>X</span>
              <DpiSlider
                label={`${name} X DPI`}
                sensor={sensor}
                value={current?.x.dpi}
                disabled={busy}
                onCommit={setX}
              />
            </div>
            <div {...stylex.props(styles.row)}>
              <span>Y</span>
              <DpiSlider
                label={`${name} Y DPI`}
                sensor={sensor}
                value={current?.y.dpi}
                disabled={busy}
                onCommit={setY}
              />
            </div>
          </div>
        ) : (
          <DpiSlider
            label={`${name} DPI`}
            sensor={sensor}
            value={current?.x.dpi}
            disabled={busy}
            onCommit={setBoth}
          />
        )}
      </div>
      {pair.error && <p role="alert">{pair.error.message}</p>}
    </div>
  );
}

export default function DpiPanel() {
  const { identity } = useConnectedDevice();
  const stages = useDeviceSetting(stagesSetting);
  const busy = useDeviceBusy();

  const cfg = stages.pending ?? stages.value;
  const [separateXY, setSeparateXY] = useState(false);

  return (
    <div>
      <p>DPI</p>
      <label>
        <input
          type="checkbox"
          checked={separateXY}
          onChange={(e) => setSeparateXY(e.target.checked)}
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
          Array.from({ length: cfg.count }, (_, i) => (
            <DpiStageRow
              key={i}
              sensor={identity.sensor}
              stage={i}
              isActive={i === cfg.active}
              separateXY={separateXY}
              onActivate={() => stages.set({ ...cfg, active: i })}
            />
          ))}
      </div>
      {stages.error && <p role="alert">{stages.error.message}</p>}
    </div>
  );
}
