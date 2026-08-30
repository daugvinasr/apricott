import { SLEEP_TIMERS } from "@/core/commands";
import { sleepTimerSetting } from "@/device/settings";
import { useDeviceBusy, useDeviceSetting } from "@/device/useDeviceSetting";
import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    minWidth: "5ch",
    textAlign: "center",
  },
});

export default function SleepTimerPanel() {
  const sleep = useDeviceSetting(sleepTimerSetting);
  const busy = useDeviceBusy();

  const shown = sleep.pending ?? sleep.value;
  const index = shown === undefined ? -1 : SLEEP_TIMERS.indexOf(shown);
  const prev = index > 0 ? SLEEP_TIMERS[index - 1] : undefined;
  const next = index >= 0 && index < SLEEP_TIMERS.length - 1 ? SLEEP_TIMERS[index + 1] : undefined;

  return (
    <div>
      <p>Sleep timer</p>
      <div {...stylex.props(styles.row)}>
        <button
          aria-label="Decrease sleep timer"
          disabled={busy || prev === undefined}
          onClick={() => prev !== undefined && sleep.set(prev)}
        >
          −
        </button>
        <span {...stylex.props(styles.amount)}>{shown === undefined ? "" : `${shown} s`}</span>
        <button
          aria-label="Increase sleep timer"
          disabled={busy || next === undefined}
          onClick={() => next !== undefined && sleep.set(next)}
        >
          +
        </button>
      </div>
      {sleep.error && <p role="alert">{sleep.error.message}</p>}
    </div>
  );
}
