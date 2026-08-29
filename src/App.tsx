import * as stylex from "@stylexjs/stylex";
import { MODEL_NAMES, Sensor } from "./core/commands";
import { Connected, DeviceProvider } from "./device/connection";
import { useConnection } from "./device/context";
import PollingRatePanel from "./components/PollingRatePanel";
import LiftOffPanel from "./components/LiftOffPanel";

const colorStyles = stylex.create({
  button: {
    backgroundColor: "red",
  },
  active: {
    backgroundColor: "orange",
  },
});

const SENSOR_LABELS = Object.fromEntries(Object.entries(Sensor).map(([name, id]) => [id, name]));

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
