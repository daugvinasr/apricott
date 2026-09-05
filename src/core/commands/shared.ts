import type { Frame } from "../bytes";

export interface Bus {
  readonly wireless: boolean;
  read(op: number, args?: number[]): Promise<Frame>;
  write(op: number, args?: number[]): Promise<void>;
}

export const Op = {
  pollingRate: 0x01,
  dpi: 0x02,
  stages: 0x03,
  sensorOptions: 0x04,
  timingOptions: 0x05,
  button: 0x06,
  wirelessLink: 0x0e,
  identity: 0x0f,
} as const;

export const MAX_DPI_STAGES = 6;
export const STAGE_INDICES: readonly number[] = Array.from({ length: MAX_DPI_STAGES }, (_, i) => i);

export function assertRange(name: string, value: number, min: number, max: number): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in ${min}..${max}, got ${value}`);
  }
}

export async function readSub(
  t: Bus,
  op: number,
  sub: number,
  args: number[] = [],
): Promise<Frame> {
  const r = await t.read(op, [sub, ...args]);
  return r.expect(sub, "Sub-command echo");
}
