import { describe, expect, it } from "vite-plus/test";
import { Sensor } from "./identity";
import {
  type ButtonAction,
  decodeAction,
  dpiToHw,
  encodeAction,
  hwToDpi,
  isHighRate,
  isPollingRate,
  POLLING_RATES,
  parseInputReport,
  pollingHzToIndex,
  pollingIndexToHz,
  snapDpi,
} from "./codecs";

describe("dpi", () => {
  it("encodes per the protocol table", () => {
    expect(dpiToHw(Sensor.PAW3395, 50)).toBe(0);
    expect(dpiToHw(Sensor.PAW3395, 1600)).toBe(31);
    expect(dpiToHw(Sensor.PAW3395, 12800)).toBe(255);
    expect(dpiToHw(Sensor.PAW3395, 32000)).toBe(639);
    expect(dpiToHw(Sensor.PAW3950, 45000)).toBe(899);
  });

  it("decodes per the protocol table", () => {
    expect(hwToDpi(Sensor.PAW3395, 0)).toBe(50);
    expect(hwToDpi(Sensor.PAW3395, 31)).toBe(1600);
    expect(hwToDpi(Sensor.PAW3395, 639)).toBe(32000);
    expect(hwToDpi(Sensor.PAW3950, 899)).toBe(45000);
  });

  it("round-trips every hw value", () => {
    for (let hw = 0; hw <= 899; hw++) {
      expect(dpiToHw(Sensor.PAW3950, hwToDpi(Sensor.PAW3950, hw))).toBe(hw);
    }
  });

  it("clamps to the sensor range", () => {
    expect(dpiToHw(Sensor.PAW3395, 0)).toBe(0);
    expect(dpiToHw(Sensor.PAW3395, 99999)).toBe(639);
    expect(dpiToHw(Sensor.PAW3950, 99999)).toBe(899);
  });

  it("snaps to 50-DPI steps", () => {
    expect(snapDpi(Sensor.PAW3395, 1620)).toBe(1600);
    expect(snapDpi(Sensor.PAW3395, 1630)).toBe(1600);
    expect(snapDpi(Sensor.PAW3395, 1699)).toBe(1650);
    expect(snapDpi(Sensor.PAW3395, 40000)).toBe(32000);
  });
});

describe("polling rate", () => {
  it("maps index <-> Hz in wire order", () => {
    expect([...POLLING_RATES]).toEqual([1000, 500, 250, 125, 8000, 4000, 2000]);
    POLLING_RATES.forEach((hz, i) => {
      expect(pollingHzToIndex(hz)).toBe(i);
      expect(pollingIndexToHz(i)).toBe(hz);
    });
  });

  it("guards unsupported rates and indices", () => {
    expect(isPollingRate(1000)).toBe(true);
    expect(isPollingRate(3000)).toBe(false);
    expect(() => pollingIndexToHz(7)).toThrow(RangeError);
  });

  it("flags ≥2000 Hz as high rate", () => {
    expect(isHighRate(1000)).toBe(false);
    expect(isHighRate(2000)).toBe(true);
    expect(isHighRate(8000)).toBe(true);
  });
});

describe("action codes", () => {
  const table: [ButtonAction, number][] = [
    [{ type: "disabled" }, 0x00000000],
    [{ type: "mouse", button: "left" }, 0x00f00001],
    [{ type: "mouse", button: "right" }, 0x00f10001],
    [{ type: "mouse", button: "middle" }, 0x00f20001],
    [{ type: "mouse", button: "back" }, 0x00f30001],
    [{ type: "mouse", button: "forward" }, 0x00f40001],
    [{ type: "dpi", op: "cycle" }, 0x00030007],
    [{ type: "dpi", op: "plus" }, 0x00010007],
    [{ type: "dpi", op: "minus" }, 0x00020007],
    [{ type: "dpiSet", stage: 5 }, 0x05040007],
    [{ type: "special", kind: "switchProfile" }, 0x0000f10a],
    [{ type: "special", kind: "rapidFire" }, 0x0218f00a],
    [{ type: "consumer", usage: 0xcd }, 0x00cd0003],
    [{ type: "consumer", usage: 0x223 }, 0x02230003],
    [{ type: "consumer", usage: 0x22a }, 0x022a0003],
    [{ type: "macro", bufferId: 3 }, 0x00030009],
    [{ type: "key", usage: 0x04, usage2: 0, modifiers: [] }, 0x00040000],
    [{ type: "key", usage: 0x04, usage2: 0, modifiers: ["lctrl", "lshift"] }, 0x00040300],
    [{ type: "key", usage: 0x04, usage2: 0x05, modifiers: ["lgui"] }, 0x05040800],
  ];

  it("encodes the protocol table", () => {
    for (const [action, code] of table) expect(encodeAction(action)).toBe(code);
  });

  it("decodes the protocol table", () => {
    for (const [action, code] of table) expect(decodeAction(code)).toEqual(action);
  });

  it("round-trips three-key combos (class 0x80)", () => {
    const a: ButtonAction = { type: "keys3", usages: [0x04, 0x05, 0x06] };
    expect(encodeAction(a)).toBe(0x06050480);
    expect(decodeAction(0x06050480)).toEqual(a);
  });

  it("passes unknown codes through", () => {
    expect(decodeAction(0x01c90006)).toEqual({ type: "unknown", code: 0x01c90006 });
    expect(decodeAction(0x0000ff0a)).toEqual({ type: "unknown", code: 0x0000ff0a });
    expect(encodeAction({ type: "unknown", code: 0xdeadbeef })).toBe(0xdeadbeef);
  });

  it("handles high-bit codes without sign issues", () => {
    expect(encodeAction({ type: "key", usage: 0x04, usage2: 0xff, modifiers: [] })).toBe(
      0xff040000,
    );
    expect(decodeAction(0xff040000)).toEqual({
      type: "key",
      usage: 0x04,
      usage2: 0xff,
      modifiers: [],
    });
  });
});

describe("input report", () => {
  const view = (bytes: number[]) => Uint8Array.from(bytes);

  it("unpacks all fields", () => {
    const d = view([0x80 | 57, 0x24, 0x40 | 8, 0, 0, 0, 0x11, 0]);
    expect(parseInputReport(d)).toEqual({
      charging: true,
      batteryPercent: 57,
      pollingRateHz: 8000,
      activeStage: 2,
      debounceMs: 8,
      activeProfile: 1,
      motionSync: true,
      lodValue: 1,
    });
  });

  it("reads zero state", () => {
    expect(parseInputReport(view([100, 0, 0, 0, 0, 0, 0, 0]))).toEqual({
      charging: false,
      batteryPercent: 100,
      pollingRateHz: 1000,
      activeStage: 0,
      debounceMs: 0,
      activeProfile: 0,
      motionSync: false,
      lodValue: 0,
    });
  });
});
