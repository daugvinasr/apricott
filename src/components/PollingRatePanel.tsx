import { readPollingRate, supportedPollingRates, writePollingRate } from "../core/commands";
import { useConnectedDevice } from "../device/context";
import { useDeviceBusy, useDeviceSetting } from "../device/useDeviceSetting";
import * as stylex from "@stylexjs/stylex";

const colorStyles = stylex.create({
  active: {
    backgroundColor: "orange",
  },
});

export default function PollingRatePanel() {
  const { identity } = useConnectedDevice();
  const polling = useDeviceSetting({
    key: "pollingRate",
    read: readPollingRate,
    write: writePollingRate,
  });
  const busy = useDeviceBusy();
  const rates = [...supportedPollingRates(identity.link)].sort((a, b) => a - b);

  return (
    <div>
      <p>Polling rate{busy ? " (busy)" : ""}</p>
      <div role="radiogroup">
        {rates.map((hz) => (
          <button
            key={hz}
            role="radio"
            aria-checked={hz === polling.value}
            disabled={busy}
            onClick={() => polling.set(hz)}
            {...stylex.props(hz === polling.value && colorStyles.active)}
          >
            {hz} Hz{hz === polling.pending ? " …" : ""}
          </button>
        ))}
      </div>
      {polling.error && <p role="alert">{polling.error.message}</p>}
    </div>
  );
}
