import { PRODUCT_ID_DONGLE, type Transport, TransportError } from "./transport";

const OP_IDENTITY = 0x0f;
const OP_WIRELESS_LINK = 0x0e;
const SUB_PRESENCE = 0x01;

const RECEIVER_8K = 0x02;
const MODEL_O29 = 6; // Only 029 reports a colourway byte

export const MODEL_NAMES = {
  1: "GHERO",
  2: "G23",
  4: "G23", // revision/SC
  3: "G24",
  5: "G24", // revision/SC
  13: "G39", // unreleased? no artwork of its own, reuses the 039 skin
  6: "029", // 零29
  9: "039", // 零39
  8: "G23V2",
  12: "G23V2", // revision/SC
  14: "G23V2", // revision/SC
} as const;

export const Sensor = {
  PAW3395: 0xf0,
  PAW3950: 0xf1, // sold as the Pro variant
} as const;

export type ModelId = keyof typeof MODEL_NAMES;
export type Sensor = (typeof Sensor)[keyof typeof Sensor];

const SENSOR_IDS: ReadonlySet<number> = new Set(Object.values(Sensor));

const isModel = (byte: number): byte is ModelId => byte in MODEL_NAMES;
const isSensor = (byte: number): byte is Sensor => SENSOR_IDS.has(byte);

export interface Identity {
  model: ModelId;
  wireless: boolean;
  receiver8k?: boolean;
  sensor: Sensor;
  colour?: number;
}

export async function readIdentity(t: Transport): Promise<Identity> {
  const r = await t.read(OP_IDENTITY);

  if (r[1] !== 1) {
    throw new TransportError(`Invalid 8F response: rdata[1] = ${r[1]}, expected 1`);
  }

  const modelByte = r[2] ?? 0;

  // The dongle inserts a link byte at rdata[3] so everything after shifts by one
  const wireless = t.device.productId === PRODUCT_ID_DONGLE;
  const sensorByte = r[wireless ? 5 : 4] ?? 0;

  if (!isSensor(sensorByte)) {
    throw new TransportError(`Unsupported sensor 0x${sensorByte.toString(16)} (PAW only)`);
  }

  if (!isModel(modelByte)) {
    throw new TransportError(`Unsupported model ${modelByte}`);
  }

  return {
    model: modelByte,
    wireless,
    receiver8k: wireless ? r[3] === RECEIVER_8K : undefined,
    sensor: sensorByte,
    colour: modelByte === MODEL_O29 ? r[wireless ? 6 : 5] : undefined,
  };
}

export async function isAwake(t: Transport): Promise<boolean> {
  const r = await t.read(OP_WIRELESS_LINK, [SUB_PRESENCE]);
  return r[6] === 1;
}
