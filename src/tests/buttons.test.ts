import { describe, expect, it } from "vite-plus/test";
import { TransportError } from "@/core/errors";
import {
  type ButtonAction,
  decodeAction,
  encodeAction,
  readButton,
  writeButton,
} from "@/core/commands";
import { MULTIMEDIA_USAGE } from "@/core/hid-usages";
import { fakeBus } from "./fake-bus";

it("reads LE32 code after matrix check", async () => {
  const { bus, reads } = fakeBus((_, [m]) => [m ?? 0, 0x01, 0x00, 0xf3, 0x00]);
  expect(await readButton(bus, "back")).toEqual({ type: "mouse", button: "back" });
  expect(reads).toEqual([{ op: 0x06, args: [3] }]);
});

it("rejects matrix mismatch", async () => {
  const { bus } = fakeBus(() => [0]);
  await expect(readButton(bus, "forward")).rejects.toThrow(TransportError);
});

it("writes LE32 code", async () => {
  const { bus, writes } = fakeBus();
  await writeButton(bus, "dpi", { type: "special", kind: "rapidFire" });
  expect(writes).toEqual([{ op: 0x06, args: [5, 0x0a, 0xf0, 0x18, 0x02] }]);
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
    [{ type: "special", kind: "rapidFire" }, 0x0218f00a],
    [{ type: "multimedia", usage: MULTIMEDIA_USAGE.playPause }, 0x00cd0003],
    [{ type: "multimedia", usage: MULTIMEDIA_USAGE.browserHome }, 0x02230003],
    [{ type: "multimedia", usage: MULTIMEDIA_USAGE.browserFavorites }, 0x022a0003],
    [{ type: "macro", bufferId: 3 }, 0x00030009],
    [{ type: "key", usage: 0x04, usage2: 0, modifiers: [] }, 0x00040000],
    [{ type: "key", usage: 0x04, usage2: 0, modifiers: ["controlLeft", "shiftLeft"] }, 0x00040300],
    [{ type: "key", usage: 0x04, usage2: 0x05, modifiers: ["metaLeft"] }, 0x05040800],
    [{ type: "key", usage: 0x04, usage2: 0xff, modifiers: [] }, 0xff040000],
    [{ type: "keys3", usages: [0x04, 0x05, 0x06] }, 0x06050480],
    [{ type: "keys3", usages: [0xe0, 0xe2, 0x4c] }, 0x4ce2e080],
  ];

  it("encodes the protocol table", () => {
    for (const [action, code] of table) expect(encodeAction(action)).toBe(code);
  });

  it("decodes the protocol table", () => {
    for (const [action, code] of table) expect(decodeAction(code)).toEqual(action);
  });

  it("passes unknown codes through", () => {
    expect(decodeAction(0x0000ff0a)).toEqual({ type: "unknown", code: 0x0000ff0a });
    expect(decodeAction(0x0000f10a)).toEqual({ type: "unknown", code: 0x0000f10a });
    expect(decodeAction(0x01c90006)).toEqual({ type: "unknown", code: 0x01c90006 });
    expect(encodeAction({ type: "unknown", code: 0xdeadbeef })).toBe(0xdeadbeef);
  });
});
