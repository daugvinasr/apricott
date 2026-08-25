import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { type Identity, isAwake, MODEL_NAMES, readIdentity, Sensor } from "./core/identity";
import { DEVICE_FILTERS, Transport } from "./core/transport";

const colorStyles = stylex.create({
  button: {
    backgroundColor: "red",
  },
});

const SENSOR_LABELS = Object.fromEntries(Object.entries(Sensor).map(([name, id]) => [id, name]));

const OP_SENSOR_OPTIONS = 0x04;
const SUB_ANGLE_SNAPPING = 0x03;

function App() {
  const [transport, setTransport] = useState<Transport | null>(null);
  const [angleSnapping, setAngleSnapping] = useState<boolean | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [awake, setAwake] = useState<boolean | null>(null);

  async function readAngleSnapping(t: Transport) {
    const r = await t.read(OP_SENSOR_OPTIONS, [SUB_ANGLE_SNAPPING]);
    setAngleSnapping(r[2] === 1);
  }

  async function connect() {
    const devices = await navigator.hid.requestDevice({ filters: DEVICE_FILTERS });
    const t = await Transport.open(devices);
    setTransport(t);

    const id = await readIdentity(t);
    setIdentity(id);
    setAwake(id.wireless ? await isAwake(t) : true);

    await readAngleSnapping(t);
  }

  async function toggleAngleSnapping() {
    if (!transport || angleSnapping === null) {
      return;
    }
    await transport.write(OP_SENSOR_OPTIONS, [SUB_ANGLE_SNAPPING, angleSnapping ? 0 : 1]);
    await readAngleSnapping(transport);
  }

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
              name: MODEL_NAMES[identity.model] + (identity.sensor === Sensor.PAW3950 ? " Pro" : ""),
              sensor: `${SENSOR_LABELS[identity.sensor]} (0x${identity.sensor.toString(16)})`,
              awake,
            },
            null,
            2,
          )}
        </pre>
      )}
      {angleSnapping !== null && (
        <div>
          <p>Angle snapping: {angleSnapping ? "enabled" : "disabled"}</p>
          <button onClick={() => toggleAngleSnapping()}>Turn {angleSnapping ? "off" : "on"}</button>
        </div>
      )}
    </div>
  );
}

export default App;
