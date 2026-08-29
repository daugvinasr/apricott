import { MAX_DEBOUNCE_MS, MIN_DEBOUNCE_MS } from "../core/commands";
import { debounceSetting } from "../device/settings";
import { useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";
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

export default function DebouncePanel() {
  const debounce = useDeviceSetting(debounceSetting);
  const busy = useDeviceBusy();

  const shown = debounce.pending ?? debounce.value;

  return (
    <div>
      <p>Debounce</p>
      <div {...stylex.props(styles.row)}>
        <button
          aria-label="Decrease debounce"
          disabled={busy || shown === undefined || shown <= MIN_DEBOUNCE_MS}
          onClick={() => shown !== undefined && debounce.set(shown - 1)}
        >
          −
        </button>
        <span {...stylex.props(styles.amount)}>{shown === undefined ? "" : `${shown} ms`}</span>
        <button
          aria-label="Increase debounce"
          disabled={busy || shown === undefined || shown >= MAX_DEBOUNCE_MS}
          onClick={() => shown !== undefined && debounce.set(shown + 1)}
        >
          +
        </button>
      </div>
      {debounce.error && <p role="alert">{debounce.error.message}</p>}
    </div>
  );
}
