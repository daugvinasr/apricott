import * as stylex from "@stylexjs/stylex";
import {
  LiftOff,
  MODEL_NAMES,
  Sensor,
  supportedLiftOffs,
  supportedPollingRates,
} from "./core/commands";
import { Connected, DeviceProvider } from "./device/connection";
import { useConnectedDevice, useConnection } from "./device/context";
import * as settings from "./device/settings";
import { useDeviceBusy, useDeviceSetting } from "./device/useDeviceSetting";

const colorStyles = stylex.create({
  button: {
    backgroundColor: "red",
  },
  active: {
    backgroundColor: "orange",
  },
});

const SENSOR_LABELS = Object.fromEntries(Object.entries(Sensor).map(([name, id]) => [id, name]));

function PollingRatePanel() {
  const { identity } = useConnectedDevice();
  const polling = useDeviceSetting(settings.pollingRate);
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

const LIFT_OFF_LABELS = {
  [LiftOff.mm07]: "0.7 mm",
  [LiftOff.mm1]: "1 mm",
  [LiftOff.mm2]: "2 mm",
} satisfies Record<LiftOff, string>;

function LiftOffPanel() {
  const { identity } = useConnectedDevice();
  const liftOff = useDeviceSetting(settings.liftOff);
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

function DevicePanel() {
  const { device, connect } = useConnection();
  const identity = device?.identity;

  return (
    <div>
      <button onClick={() => connect()} {...stylex.props(colorStyles.button)}>
        Connect
      </button>
      {identity && (
        <pre>
          {JSON.stringify(
            {
              ...identity,
              name:
                MODEL_NAMES[identity.model] + (identity.sensor === Sensor.PAW3950 ? " Pro" : ""),
              sensor: `${SENSOR_LABELS[identity.sensor]} (0x${identity.sensor.toString(16)})`,
            },
            null,
            2,
          )}
        </pre>
      )}
      <Connected>
        <PollingRatePanel />
        <LiftOffPanel />
      </Connected>
    </div>
  );
}

function App() {
  return (
    <DeviceProvider>
      <DevicePanel />
    </DeviceProvider>
  );
}

export default App;
