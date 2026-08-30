import { invert, packLe32, unpackLe32 } from "../bytes";
import { KEY_USAGE, type KeyName } from "../hid-usages";
import { type Bus, Op, readSub } from "./shared";

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

const MODIFIERS = ["controlLeft", "shiftLeft", "altLeft", "metaLeft"] as const satisfies KeyName[];

const DPI_SUBOP = { plus: 1, minus: 2, cycle: 3 } as const;
const DPI_SET_SUBOP = 4;

const SPECIAL_CODE = { rapidFire: 0x0218f00a } as const;

export type MouseButton = keyof typeof MOUSE_SELECTOR;
export type Modifier = (typeof MODIFIERS)[number];
export type DpiOp = keyof typeof DPI_SUBOP;
export type SpecialKind = keyof typeof SPECIAL_CODE;

const modBit = (m: Modifier): number => 1 << (KEY_USAGE[m] - KEY_USAGE.controlLeft);

export type ButtonAction =
  | { type: "disabled" }
  | { type: "mouse"; button: MouseButton }
  /** `usage2` is 0 when there is no second key (HID usage 0 = no event). */
  | { type: "key"; usage: number; usage2: number; modifiers: Modifier[] }
  | { type: "keys3"; usages: [number, number, number] }
  | { type: "multimedia"; usage: number }
  | { type: "dpi"; op: DpiOp }
  | { type: "dpiSet"; stage: number }
  | { type: "macro"; bufferId: number }
  | { type: "special"; kind: SpecialKind }
  | { type: "unknown"; code: number };

const MOUSE_BY_SELECTOR = invert(MOUSE_SELECTOR);
const DPI_OP_BY_SUBOP = invert(DPI_SUBOP);
const SPECIAL_BY_CODE = invert(SPECIAL_CODE);

const ActionClass = {
  key: 0x00,
  mouse: 0x01,
  multimedia: 0x03,
  dpi: 0x07,
  macro: 0x09,
  special: 0x0a,
  keys3: 0x80,
} as const;

export function encodeAction(a: ButtonAction): number {
  switch (a.type) {
    case "disabled":
      return 0;
    case "mouse":
      return packLe32([ActionClass.mouse, 0, MOUSE_SELECTOR[a.button], 0]);
    case "key": {
      const mod = a.modifiers.reduce((m, x) => m | modBit(x), 0);
      return packLe32([ActionClass.key, mod, a.usage, a.usage2]);
    }
    case "keys3":
      return packLe32([ActionClass.keys3, ...a.usages]);
    case "multimedia":
      return packLe32([ActionClass.multimedia, 0, a.usage, a.usage >> 8]);
    case "dpi":
      return packLe32([ActionClass.dpi, 0, DPI_SUBOP[a.op], 0]);
    case "dpiSet":
      return packLe32([ActionClass.dpi, 0, DPI_SET_SUBOP, a.stage]);
    case "macro":
      return packLe32([ActionClass.macro, 0, a.bufferId, 0]);
    case "special":
      return SPECIAL_CODE[a.kind];
    case "unknown":
      return a.code >>> 0;
  }
}

export function decodeAction(raw: number): ButtonAction {
  const code = raw >>> 0;
  const [k1, k2, k3, k4] = unpackLe32(code);
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
    case ActionClass.multimedia:
      return { type: "multimedia", usage: (k4 << 8) | k3 };
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

export async function readButton(t: Bus, button: ButtonName): Promise<ButtonAction> {
  const r = await readSub(t, Op.button, BUTTON_MATRIX[button]);
  return decodeAction(r.le32(0));
}

export async function writeButton(t: Bus, button: ButtonName, action: ButtonAction): Promise<void> {
  return t.write(Op.button, [BUTTON_MATRIX[button], ...unpackLe32(encodeAction(action))]);
}
