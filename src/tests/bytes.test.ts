import { describe, expect, it } from "vite-plus/test";
import { Frame, packLe32, unpackLe32 } from "@/core/bytes";
import { TransportError } from "@/core/errors";

describe("Frame", () => {
  const f = new Frame(Uint8Array.from([0x81, 0x34, 0x12, 0xaa, 0xbb, 0xcc]));

  it("reads le16/le32", () => {
    expect(f.le16(1)).toBe(0x1234);
    expect(f.le32(2)).toBe(0xccbbaa12);
  });

  it("expect drops the checked byte", () => {
    expect(f.expect(0x81, "op").u8(0)).toBe(0x34);
    expect(() => f.expect(0x00, "op")).toThrow("op mismatch");
  });

  it("throws on out-of-range index", () => {
    expect(() => f.u8(6)).toThrow(TransportError);
    expect(() => f.drop(5).le16(0)).toThrow(TransportError);
  });
});

it("packLe32 / unpackLe32 round-trip", () => {
  expect(unpackLe32(packLe32([1, 2, 3, 0xff]))).toEqual([1, 2, 3, 0xff]);
});
