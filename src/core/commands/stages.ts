import { MAX_DPI_STAGES } from "./dpi";
import { assertRange, type Bus, Op } from "./shared";

export interface StageConfig {
  count: number;
  active: number;
  dpiEffect: number;
  reserved: [number, number]; // Trailing bytes with no known meaning, read back and written unchanged
}

export async function readStages(t: Bus): Promise<StageConfig> {
  const r = await t.read(Op.stages);

  return {
    count: r.u8(0),
    active: r.u8(1),
    dpiEffect: r.u8(2),
    reserved: [r.u8(3), r.u8(4)],
  };
}

export async function writeStages(t: Bus, cfg: StageConfig): Promise<void> {
  assertRange("count", cfg.count, 1, MAX_DPI_STAGES);
  assertRange("active", cfg.active, 0, cfg.count - 1);
  assertRange("dpiEffect", cfg.dpiEffect, 0, 2);

  return t.write(Op.stages, [cfg.count, cfg.active, cfg.dpiEffect, ...cfg.reserved]);
}
