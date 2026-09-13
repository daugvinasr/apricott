import { type ButtonAction, type Modifier, MODIFIERS } from "./commands";
import { isModifierUsage, usageFromCode } from "./hid-usages";

export type KeyEventLike = Pick<
  KeyboardEvent,
  "type" | "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey"
>;

const MODIFIER_FLAGS = {
  controlLeft: "ctrlKey",
  shiftLeft: "shiftKey",
  altLeft: "altKey",
  metaLeft: "metaKey",
} satisfies Record<Modifier, keyof KeyEventLike>;

const heldModifiers = (e: KeyEventLike): Modifier[] =>
  MODIFIERS.filter((modifier) => e[MODIFIER_FLAGS[modifier]]);

// A lone modifier binds on release so a following key can still form a combination
export function recordedKeyAction(e: KeyEventLike): ButtonAction | undefined {
  const usage = usageFromCode(e.code);
  if (usage === undefined) return undefined;

  const bindsOn = isModifierUsage(usage) ? "keyup" : "keydown";
  if (e.type !== bindsOn) return undefined;

  return { type: "key", usage, usage2: 0, modifiers: heldModifiers(e) };
}
