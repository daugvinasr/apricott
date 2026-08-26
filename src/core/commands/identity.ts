import { hex, isValueOf } from "../bytes";
import { TransportError } from "../errors";
import { type Bus, Op } from "./shared";

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

export type ModelId = keyof typeof MODEL_NAMES;

export const Sensor = {
  PAW3395: 0xf0,
  PAW3950: 0xf1, // sold as the Pro variant
} as const;

export type Sensor = (typeof Sensor)[keyof typeof Sensor];

const isModel = (byte: number): byte is ModelId => byte in MODEL_NAMES;
const isSensor = isValueOf(Sensor);

export type Link = { kind: "wired" } | { kind: "dongle"; receiver8k: boolean };

export interface Identity {
  model: ModelId;
  sensor: Sensor;
  link: Link;
  colour?: number; // Only reported by 029
}

export async function readIdentity(t: Bus): Promise<Identity> {
  const r = (await t.read(Op.identity)).expect(1, "Identity marker");
  const model = r.u8(0);

  const linkByte = r.u8(1);

  const link: Link = t.wireless
    ? { kind: "dongle", receiver8k: linkByte === RECEIVER_8K }
    : { kind: "wired" };

  const body = r.drop(linkByte === RECEIVER_8K || t.wireless ? 3 : 2);
  const sensor = body.u8(0);

  if (!isSensor(sensor)) {
    throw new TransportError(`Unsupported sensor ${hex(sensor)} (PAW only)`);
  }

  if (!isModel(model)) {
    throw new TransportError(`Unsupported model ${model}`);
  }

  return {
    model,
    sensor,
    link,
    colour: model === MODEL_O29 ? body.u8(1) : undefined,
  };
}

export async function isAwake(t: Bus): Promise<boolean> {
  const r = await t.read(Op.wirelessLink, [SUB_PRESENCE]);
  return r.u8(5) === 1;
}
