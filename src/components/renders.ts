import { type ModelId, MODEL_NAMES } from "@/core/commands";

type ModelName = (typeof MODEL_NAMES)[ModelId];

const RENDERS = new Map<ModelName, string>([
  ["GHERO", "/mouseGhero.png"],
  ["G23", "/mouseG23.png"],
  ["G23V2", "/mouseG23V2.png"],
  ["G24", "/mouseG24.png"],
]);

export const LINEUP = [...RENDERS].map(([name, src]) => ({ name, src }));

export function renderFor(model: ModelId): string | undefined {
  return RENDERS.get(MODEL_NAMES[model]);
}
