import { LiftOff, readLiftOff, supportedLiftOffs, writeLiftOff } from "../core/commands";
import { useConnectedDevice } from "../device/context";
import { useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";
import * as stylex from "@stylexjs/stylex";

const colorStyles = stylex.create({
  active: {
    backgroundColor: "orange",
  },
});

const LIFT_OFF_LABELS = {
  [LiftOff.mm07]: "0.7 mm",
  [LiftOff.mm1]: "1 mm",
  [LiftOff.mm2]: "2 mm",
} satisfies Record<LiftOff, string>;

export default function LiftOffPanel() {
  const { identity } = useConnectedDevice();
  const liftOff = useDeviceSetting({
    key: "liftOff",
    read: readLiftOff,
    write: writeLiftOff,
  });
  const busy = useDeviceBusy();

  return (
    <div>
      <p>Lift-off distance</p>
      <div role="radiogroup">
        {supportedLiftOffs(identity.sensor).map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={v === liftOff.value}
            disabled={busy}
            onClick={() => liftOff.set(v)}
            {...stylex.props(v === liftOff.value && colorStyles.active)}
          >
            {LIFT_OFF_LABELS[v]}
            {v === liftOff.pending ? " …" : ""}
          </button>
        ))}
      </div>
      {liftOff.error && <p role="alert">{liftOff.error.message}</p>}
    </div>
  );
}
