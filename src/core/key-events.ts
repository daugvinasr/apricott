import { type ButtonAction, type Modifier, MODIFIERS } from "./commands";
import { isModifierUsage, KEY_USAGE, type KeyName, usageFromCode } from "./hid-usages";

export type KeyEventLike = Pick<
  KeyboardEvent,
  "type" | "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey"
>;

const MODIFIER_KEYS = {
  controlLeft: ["ctrlKey", "controlRight"],
  shiftLeft: ["shiftKey", "shiftRight"],
  altLeft: ["altKey", "altRight"],
  metaLeft: ["metaKey", "metaRight"],
} as const satisfies Record<Modifier, [keyof KeyEventLike, KeyName]>;

const isLeftModifier = (name: KeyName): name is Modifier => Object.hasOwn(MODIFIER_KEYS, name);

// Event flags carry no handedness, so keys seen going down decide it
const heldModifiers = (e: KeyEventLike, down: ReadonlySet<KeyName>): KeyName[] =>
  MODIFIERS.filter((left) => e[MODIFIER_KEYS[left][0]]).map((left) => {
    const right = MODIFIER_KEYS[left][1];
    return down.has(right) && !down.has(left) ? right : left;
  });

// Modifiers bind on release so they can still start a combination
export function recordedKeyAction(
  e: KeyEventLike,
  down: ReadonlySet<KeyName>,
): ButtonAction | undefined {
  const usage = usageFromCode(e.code);
  if (usage === undefined) return undefined;

  const bindsOn = isModifierUsage(usage) ? "keyup" : "keydown";
  if (e.type !== bindsOn) return undefined;

  const held = heldModifiers(e, down);
  const modifiers = held.filter(isLeftModifier);
  // The modifier byte only has left-hand bits
  const [right1, right2, ...more] = held
    .filter((name) => !isLeftModifier(name))
    .map((name) => KEY_USAGE[name]);

  if (right1 === undefined) return { type: "key", usage, usage2: 0, modifiers };
  if (right2 === undefined) return { type: "key", usage: right1, usage2: usage, modifiers };
  if (more.length === 0 && modifiers.length === 0) {
    return { type: "keys3", usages: [right1, right2, usage] };
  }
  return undefined;
}
