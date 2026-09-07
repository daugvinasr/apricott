import { describe, expect, it } from "vite-plus/test";
import {
  IMPLICIT_GAP_MS,
  MACRO_BLOB_LENGTH,
  MAX_MACRO_SLOTS,
  type Macro,
  MacroLoop,
  decodeMacro,
  encodeMacro,
  readMacro,
  writeMacro,
} from "@/core/commands";
import { TransportError } from "@/core/errors";
import { KEY_USAGE } from "@/core/hid-usages";
import { fakeBus } from "./fake-bus";

const A = KEY_USAGE.a;
const B = KEY_USAGE.b;

const macro = (events: Macro["events"], rest: Partial<Macro> = {}): Macro => ({
  name: "test",
  loop: MacroLoop.times,
  repeats: 1,
  events,
  ...rest,
});

const slot = (blob: Uint8Array, n: number) => [...blob.subarray(4 + n * 4, 8 + n * 4)];
const keys = (n: number): Macro["events"] =>
  Array.from({ length: n }, () => ({ type: "down", usage: A }));

describe("encodeMacro", () => {
  it("writes header, name and tail", () => {
    const blob = encodeMacro(
      3,
      macro([{ type: "down", usage: A }], { loop: MacroLoop.untilClick, repeats: 0x1234 }),
    );
    expect(blob.length).toBe(MACRO_BLOB_LENGTH);
    expect([...blob.subarray(0, 4)]).toEqual([3, MacroLoop.untilClick, 0x34, 0x12]);
    expect([...blob.subarray(0x120, 0x125)]).toEqual([0x74, 0x65, 0x73, 0x74, 0]);
    expect([...blob.subarray(0x130, 0x134)]).toEqual([0x70, 0, 0, 0]);
    expect([...blob.subarray(0x134, 0x138)]).toEqual([0x10, 0x00, 0xe8, 0xe8]);
    expect([...blob.subarray(0x13c, 0x140)]).toEqual([1, 0, 1, 0]);
  });

  it("packs a key with its trailing delay into one slot", () => {
    const blob = encodeMacro(
      0,
      macro([
        { type: "down", usage: A },
        { type: "delay", ms: 0x1234 },
        { type: "up", usage: A },
        { type: "delay", ms: 50 },
      ]),
    );
    expect(slot(blob, 0)).toEqual([0x01, A, 0x34, 0x12]);
    expect(slot(blob, 1)).toEqual([0x81, A, 50, 0]);
    expect(blob[0x13e]).toBe(3);
    expect([...blob.subarray(0x13c, 0x13e)]).toEqual([4, 0]);
  });

  it("inserts the implicit gap between adjacent keys", () => {
    const blob = encodeMacro(
      0,
      macro([
        { type: "down", usage: A },
        { type: "down", usage: B },
        { type: "up", usage: B },
      ]),
    );
    expect(slot(blob, 0)).toEqual([0x02, A, IMPLICIT_GAP_MS, 0]);
    expect(slot(blob, 1)).toEqual([0x02, B, IMPLICIT_GAP_MS, 0]);
    expect(slot(blob, 2)).toEqual([0x80, B, 8, 0]);
    expect(blob[0x13e]).toBe(3);
  });

  it("stores a leading delay in its own slot", () => {
    const blob = encodeMacro(
      0,
      macro([
        { type: "delay", ms: 500 },
        { type: "down", usage: A },
      ]),
    );
    expect(slot(blob, 0)).toEqual([0x04, 0, 0xf4, 0x01]);
    expect(slot(blob, 1)).toEqual([0x00, A, 0, 0]);
  });

  it("matches the vendor builder's layout", () => {
    // FUN_0044a950: slot cursor starts at 1 and writes to blob[cursor * 4],
    // so the first slot follows the 4-byte header directly.
    const blob = encodeMacro(
      0,
      macro([
        { type: "down", usage: A },
        { type: "up", usage: A },
      ]),
    );
    expect([...blob.subarray(4, 12)]).toEqual([0x02, A, IMPLICIT_GAP_MS, 0, 0x80, A, 8, 0]);
    expect(MAX_MACRO_SLOTS).toBe(71);
  });

  it("fills all 71 slots", () => {
    const blob = encodeMacro(0, macro(keys(MAX_MACRO_SLOTS)));
    expect(slot(blob, 70)).toEqual([0x00, A, 0, 0]);
    expect([...blob.subarray(0x13c, 0x140)]).toEqual([71, 0, 71, 0]);
    expect(decodeMacro(blob)?.events).toHaveLength(71);
  });

  it("rejects events that need more slots than fit", () => {
    expect(() => encodeMacro(0, macro(keys(MAX_MACRO_SLOTS + 1)))).toThrow(RangeError);
    const delays: Macro["events"] = Array.from({ length: MAX_MACRO_SLOTS }, () => ({
      type: "delay",
      ms: 1,
    }));
    expect(() => encodeMacro(0, macro(delays))).toThrow(RangeError);
    expect(() => encodeMacro(0, macro(delays.slice(0, -1)))).not.toThrow();
  });

  it("rejects out-of-range events", () => {
    expect(() => encodeMacro(0, macro([{ type: "down", usage: 0x100 }]))).toThrow(RangeError);
    expect(() => encodeMacro(0, macro([{ type: "down", usage: 0 }]))).toThrow(RangeError);
    expect(() => encodeMacro(0, macro([{ type: "delay", ms: -1 }]))).toThrow(RangeError);
  });

  it("rejects long names", () => {
    expect(() => encodeMacro(0, macro([], { name: "sixteen chars!!!" }))).toThrow(RangeError);
  });

  it("rejects repeats above the vendor clamp", () => {
    expect(() => encodeMacro(0, macro([], { repeats: 0xfffe }))).toThrow(RangeError);
  });
});

describe("decodeMacro", () => {
  it("returns null for an empty slot", () => {
    expect(decodeMacro(new Uint8Array(MACRO_BLOB_LENGTH))).toBeNull();
  });

  it("rejects an unknown loop type", () => {
    const blob = encodeMacro(0, macro([]));
    blob[1] = 9;
    expect(() => decodeMacro(blob)).toThrow(TransportError);
  });

  it("round-trips", () => {
    const cases: Macro[] = [
      macro([]),
      macro([
        { type: "delay", ms: 20 },
        { type: "down", usage: A },
        { type: "up", usage: A },
      ]),
      macro(
        [
          { type: "down", usage: A },
          { type: "delay", ms: 100 },
          { type: "down", usage: B },
          { type: "up", usage: B },
          { type: "delay", ms: 7 },
          { type: "up", usage: A },
        ],
        { name: "ünïcode", loop: MacroLoop.untilReleased, repeats: 0 },
      ),
      macro([
        { type: "delay", ms: 1 },
        { type: "delay", ms: 2 },
        { type: "down", usage: A },
        { type: "delay", ms: 3 },
        { type: "delay", ms: 4 },
        { type: "up", usage: A },
      ]),
    ];

    for (const m of cases) {
      const blob = encodeMacro(5, m);
      expect(decodeMacro(blob)).toEqual(m);
      expect(encodeMacro(5, m)).toEqual(blob);
    }
  });
});

describe("transfer", () => {
  it("uploads ten 32-byte chunks", async () => {
    const { bus, blockWrites } = fakeBus();
    const m = macro([{ type: "down", usage: A }]);
    await writeMacro(bus, 2, m);
    const blob = encodeMacro(2, m);

    expect(blockWrites).toHaveLength(10);
    expect(blockWrites.map((w) => w.op)).toEqual(Array(10).fill(0x07));
    expect(blockWrites.map((w) => w.args)).toEqual(
      Array.from({ length: 10 }, (_, i) => [10, i, 32, 2]),
    );
    expect(blockWrites.flatMap((w) => w.data)).toEqual([...blob]);
  });

  it("downloads and decodes", async () => {
    const m = macro([
      { type: "down", usage: A },
      { type: "up", usage: A },
    ]);
    const blob = encodeMacro(4, m);
    const { bus, blockReads } = fakeBus((op, [, chunk = 0]) =>
      op === 0x07 ? [...blob.subarray(chunk * 32, chunk * 32 + 32)] : [],
    );

    expect(await readMacro(bus, 4)).toEqual(m);
    expect(blockReads.map((r) => r.args)).toEqual(
      Array.from({ length: 10 }, (_, i) => [10, i, 32, 4]),
    );
  });
});

describe("library id", () => {
  it("does not depend on the buffer id", () => {
    const m = macro([{ type: "down", usage: A }]);
    const id = (blob: Uint8Array) => [...blob.subarray(0x138, 0x13c)];
    expect(id(encodeMacro(0, m))).toEqual(id(encodeMacro(7, m)));
    expect(id(encodeMacro(0, m))).not.toEqual(
      id(encodeMacro(0, macro([{ type: "up", usage: A }]))),
    );
  });
});
