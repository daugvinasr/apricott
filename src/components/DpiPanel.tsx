import { MAX_STAGES, SENSOR_DPI, type Sensor, snapDpi } from "../core/commands";
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
  active: {
    backgroundColor: "orange",
  },
});

function DpiStageRow({
  sensor,
  stage,
  isActive,
  onActivate,
}: {
  sensor: Sensor;
  stage: number;
  isActive: boolean;
  onActivate: () => void;
}) {
  const setting = dpiStageSetting(sensor, stage);
  const pair = useDeviceSetting(setting);
  const busy = useDeviceBusy();
  const { min, max, step } = SENSOR_DPI[sensor];

  const current = pair.pending ?? pair.value;
  const dpi = current?.x.dpi;
  const [draft, setDraft] = useState<number>();
  const shown = draft ?? dpi;

  const commit = () => {
    if (draft === undefined || !current) return;
    setDraft(undefined);
    if (draft === dpi) return;
    pair.set({ x: { ...current.x, dpi: draft }, y: { ...current.y, dpi: draft } });
  };

  return (
    <div>
      <div {...stylex.props(styles.row)}>
        <button
          role="radio"
          aria-checked={isActive}
          aria-label={`Stage ${stage + 1}`}
          disabled={busy}
          onClick={onActivate}
          {...stylex.props(isActive && styles.active)}
        >
          {stage + 1}
        </button>
        <input
          type="range"
          aria-label={`Stage ${stage + 1} DPI`}
          min={min}
          max={max}
          step={step}
          value={shown ?? min}
          disabled={busy || dpi === undefined}
          onChange={(e) => setDraft(snapDpi(sensor, Number(e.target.value)))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
          {...stylex.props(styles.slider)}
        />
        <span {...stylex.props(styles.amount)}>{shown ?? ""}</span>
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

  return (
    <div>
      <p>DPI</p>
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
          disabled={busy || !cfg || cfg.count >= MAX_STAGES}
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
              onActivate={() => stages.set({ ...cfg, active: i })}
            />
          ))}
      </div>
      {stages.error && <p role="alert">{stages.error.message}</p>}
    </div>
  );
}
