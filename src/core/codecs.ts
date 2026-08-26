import { Sensor } from "./identity";

export interface DpiRange {
  min: number;
  max: number;
  step: number;
}

export const SENSOR_DPI = {
  [Sensor.PAW3395]: { min: 50, max: 32000, step: 50 },
  [Sensor.PAW3950]: { min: 50, max: 45000, step: 50 },
} satisfies Record<Sensor, DpiRange>;

export function dpiToHw(sensor: Sensor, dpi: number): number {
  const { min, max, step } = SENSOR_DPI[sensor];
  const clamped = Math.min(max, Math.max(min, dpi));
  return Math.floor((clamped - min) / step);
}

export function hwToDpi(sensor: Sensor, hw: number): number {
  const { min, step } = SENSOR_DPI[sensor];
  return min + hw * step;
}

export function snapDpi(sensor: Sensor, dpi: number): number {
  return hwToDpi(sensor, dpiToHw(sensor, dpi));
}

export const POLLING_RATES = [1000, 500, 250, 125, 8000, 4000, 2000] as const;

export type PollingRate = (typeof POLLING_RATES)[number];

const POLLING_RATE_SET: ReadonlySet<number> = new Set(POLLING_RATES);

export const isPollingRate = (hz: number): hz is PollingRate => POLLING_RATE_SET.has(hz);

export const pollingHzToIndex = (hz: PollingRate): number => POLLING_RATES.indexOf(hz);

export function pollingIndexToHz(index: number): PollingRate {
  const hz = POLLING_RATES[index];

  if (hz === undefined) {
    throw new RangeError(`Unsupported polling rate index ${index}`);
  }

  return hz;
}

export const isHighRate = (hz: number): boolean => hz >= 2000;

export const BUTTON_MATRIX = {
  left: 0,
  right: 1,
  middle: 2,
  back: 3,
  forward: 4,
  dpi: 5,
} as const;

export type ButtonName = keyof typeof BUTTON_MATRIX;

const MOUSE_SELECTOR = {
  left: 0xf0,
  right: 0xf1,
  middle: 0xf2,
  back: 0xf3,
  forward: 0xf4,
} as const;

const MODIFIERS = ["lctrl", "lshift", "lalt", "lgui"] as const;

const DPI_SUBOP = { plus: 1, minus: 2, cycle: 3 } as const;
const DPI_SET_SUBOP = 4;

const SPECIAL_CODE = { rapidFire: 0x0218f00a, switchProfile: 0x0000f10a } as const;

export type MouseButton = keyof typeof MOUSE_SELECTOR;
export type Modifier = (typeof MODIFIERS)[number];
export type DpiOp = keyof typeof DPI_SUBOP;
export type SpecialKind = keyof typeof SPECIAL_CODE;

const modBit = (m: Modifier): number => 1 << MODIFIERS.indexOf(m);

export type ButtonAction =
  | { type: "disabled" }
  | { type: "mouse"; button: MouseButton }
  /** `usage2` is 0 when there is no second key (HID usage 0 = no event). */
  | { type: "key"; usage: number; usage2: number; modifiers: Modifier[] }
  | { type: "keys3"; usages: [number, number, number] }
  | { type: "consumer"; usage: number }
  | { type: "dpi"; op: DpiOp }
  | { type: "dpiSet"; stage: number }
  | { type: "macro"; bufferId: number }
  | { type: "special"; kind: SpecialKind }
  | { type: "unknown"; code: number };

const invert = <K extends string>(rec: Record<K, number>): ReadonlyMap<number, K> => {
  const map = new Map<number, K>();
  for (const k in rec) map.set(rec[k], k);
  return map;
};

const MOUSE_BY_SELECTOR = invert(MOUSE_SELECTOR);
const DPI_OP_BY_SUBOP = invert(DPI_SUBOP);
const SPECIAL_BY_CODE = invert(SPECIAL_CODE);

const ActionClass = {
  key: 0x00,
  mouse: 0x01,
  consumer: 0x03,
  dpi: 0x07,
  macro: 0x09,
  special: 0x0a,
  keys3: 0x80,
} as const;

type Bytes = [k1: number, k2: number, k3: number, k4: number];

const u8 = (n: number) => n & 0xff;

const pack = ([k1, k2, k3, k4]: Bytes): number =>
  ((u8(k4) << 24) | (u8(k3) << 16) | (u8(k2) << 8) | u8(k1)) >>> 0;

const unpack = (code: number): Bytes => [
  code & 0xff,
  (code >>> 8) & 0xff,
  (code >>> 16) & 0xff,
  (code >>> 24) & 0xff,
];

export function encodeAction(a: ButtonAction): number {
  switch (a.type) {
    case "disabled":
      return 0;
    case "mouse":
      return pack([ActionClass.mouse, 0, MOUSE_SELECTOR[a.button], 0]);
    case "key": {
      const mod = a.modifiers.reduce((m, x) => m | modBit(x), 0);
      return pack([ActionClass.key, mod, a.usage, a.usage2]);
    }
    case "keys3":
      return pack([ActionClass.keys3, ...a.usages]);
    case "consumer":
      return pack([ActionClass.consumer, 0, a.usage, a.usage >> 8]);
    case "dpi":
      return pack([ActionClass.dpi, 0, DPI_SUBOP[a.op], 0]);
    case "dpiSet":
      return pack([ActionClass.dpi, 0, DPI_SET_SUBOP, a.stage]);
    case "macro":
      return pack([ActionClass.macro, 0, a.bufferId, 0]);
    case "special":
      return SPECIAL_CODE[a.kind];
    case "unknown":
      return a.code >>> 0;
  }
}

export function decodeAction(raw: number): ButtonAction {
  const code = raw >>> 0;
  const [k1, k2, k3, k4] = unpack(code);
  const unknown: ButtonAction = { type: "unknown", code };

  switch (k1) {
    case ActionClass.key:
      // A key action with no keys and no modifiers is the disabled code
      if (code === 0) {
        return { type: "disabled" };
      }

      return {
        type: "key",
        usage: k3,
        usage2: k4,
        modifiers: MODIFIERS.filter((m) => k2 & modBit(m)),
      };
    case ActionClass.mouse: {
      const button = MOUSE_BY_SELECTOR.get(k3);
      return button ? { type: "mouse", button } : unknown;
    }
    case ActionClass.consumer:
      return { type: "consumer", usage: (k4 << 8) | k3 };
    case ActionClass.dpi: {
      if (k3 === DPI_SET_SUBOP) return { type: "dpiSet", stage: k4 };
      const op = DPI_OP_BY_SUBOP.get(k3);
      return op ? { type: "dpi", op } : unknown;
    }
    case ActionClass.macro:
      return { type: "macro", bufferId: k3 };
    case ActionClass.special: {
      const kind = SPECIAL_BY_CODE.get(code);
      return kind ? { type: "special", kind } : unknown;
    }
    case ActionClass.keys3:
      return { type: "keys3", usages: [k2, k3, k4] };
    default:
      return unknown;
  }
}

export interface InputReport {
  charging: boolean;
  batteryPercent: number;
  pollingRateHz: PollingRate;
  activeStage: number;
  debounceMs: number;
  activeProfile: number;
  motionSync: boolean;
  lodValue: number;
}

export function parseInputReport(d: Uint8Array): InputReport {
  const b0 = d[0] ?? 0;
  const b1 = d[1] ?? 0;
  const b2 = d[2] ?? 0;
  const b6 = d[6] ?? 0;
  return {
    charging: (b0 & 0x80) !== 0,
    batteryPercent: b0 & 0x7f,
    pollingRateHz: pollingIndexToHz(b1 & 0x0f),
    activeStage: b1 >> 4,
    debounceMs: b2 & 0x3f,
    activeProfile: b2 >> 6,
    motionSync: (b6 & 0x0f) !== 0,
    lodValue: b6 >> 4,
  };
}
