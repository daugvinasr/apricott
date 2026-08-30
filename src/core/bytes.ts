import { TransportError } from "./errors";

export const hex = (n: number) => `0x${n.toString(16).padStart(2, "0")}`;

const lo = (n: number) => n & 0xff;
const hi = (n: number) => (n >> 8) & 0xff;

export const le16Bytes = (n: number): [number, number] => [lo(n), hi(n)];

/** Type guard for membership in a `{ name: number }` table. */
export function isValueOf<T extends Record<string, number>>(table: T) {
  const values: ReadonlySet<number> = new Set(Object.values(table));
  return (v: number): v is T[keyof T] => values.has(v);
}

/** Inverts a `{ name: number }` table into a `number -> name` map. */
export function invert<K extends string>(rec: Record<K, number>): ReadonlyMap<number, K> {
  const map = new Map<number, K>();
  for (const k in rec) map.set(rec[k], k);
  return map;
}

export type Le32Bytes = [b0: number, b1: number, b2: number, b3: number];

export const packLe32 = ([b0, b1, b2, b3]: Le32Bytes): number =>
  ((lo(b3) << 24) | (lo(b2) << 16) | (lo(b1) << 8) | lo(b0)) >>> 0;

export const unpackLe32 = (code: number): Le32Bytes => [
  code & 0xff,
  (code >>> 8) & 0xff,
  (code >>> 16) & 0xff,
  (code >>> 24) & 0xff,
];

/** Little-endian reader over a fixed-length frame. Out-of-range reads throw. */
export class Frame {
  readonly #bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  get length(): number {
    return this.#bytes.length;
  }

  u8(i: number): number {
    const b = this.#bytes[i];

    if (b === undefined) {
      throw new TransportError(`Frame index ${i} out of range (length ${this.length})`);
    }

    return b;
  }

  le16(i: number): number {
    return this.u8(i) | (this.u8(i + 1) << 8);
  }

  le32(i: number): number {
    return packLe32([this.u8(i), this.u8(i + 1), this.u8(i + 2), this.u8(i + 3)]);
  }

  drop(n: number): Frame {
    return new Frame(this.#bytes.subarray(n));
  }

  /** Asserts byte 0 is `value` and returns the frame after it. */
  expect(value: number, label: string): Frame {
    const actual = this.u8(0);

    if (actual !== value) {
      throw new TransportError(`${label} mismatch: expected ${hex(value)}, got ${hex(actual)}`);
    }

    return this.drop(1);
  }
}
