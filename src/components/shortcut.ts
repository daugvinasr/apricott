import { hex } from "@/core/bytes";
import type { ButtonAction } from "@/core/commands";
import { KEY_BY_USAGE, KEY_USAGE, type KeyName } from "@/core/hid-usages";

// Only keys Kbd would not spell right from their name. Kbd splits on +, so plus is spelled out
const KEY_DISPLAY = new Map(
  Object.entries({
    controlLeft: "ctrl",
    shiftLeft: "shift",
    altLeft: "alt",
    metaLeft: "meta",
    controlRight: "right ctrl",
    shiftRight: "right shift",
    altRight: "right alt",
    metaRight: "right meta",
    digit1: "1",
    digit2: "2",
    digit3: "3",
    digit4: "4",
    digit5: "5",
    digit6: "6",
    digit7: "7",
    digit8: "8",
    digit9: "9",
    digit0: "0",
    minus: "-",
    equal: "=",
    bracketLeft: "[",
    bracketRight: "]",
    backslash: "\\",
    semicolon: ";",
    quote: "'",
    backquote: "`",
    comma: ",",
    period: ".",
    slash: "/",
    capsLock: "caps lock",
    printScreen: "print screen",
    scrollLock: "scroll lock",
    pageUp: "page up",
    pageDown: "page down",
    arrowRight: "right",
    arrowLeft: "left",
    arrowDown: "down",
    arrowUp: "up",
    contextMenu: "menu",
    numLock: "num lock",
    numpadDivide: "num /",
    numpadMultiply: "num *",
    numpadSubtract: "num -",
    numpadAdd: "num plus",
    numpadEnter: "num enter",
    numpad1: "num 1",
    numpad2: "num 2",
    numpad3: "num 3",
    numpad4: "num 4",
    numpad5: "num 5",
    numpad6: "num 6",
    numpad7: "num 7",
    numpad8: "num 8",
    numpad9: "num 9",
    numpad0: "num 0",
    numpadDecimal: "num .",
  } satisfies Partial<Record<KeyName, string>>),
);

function usageDisplay(usage: number): string {
  const name = KEY_BY_USAGE.get(usage);
  return name ? (KEY_DISPLAY.get(name) ?? name) : hex(usage);
}

export type ShortcutAction = Extract<ButtonAction, { type: "key" | "keys3" }>;

export function shortcutKeys(action: ShortcutAction): string {
  const usages =
    action.type === "key"
      ? [...action.modifiers.map((modifier) => KEY_USAGE[modifier]), action.usage, action.usage2]
      : action.usages;

  return usages
    .filter((usage) => usage !== 0)
    .map(usageDisplay)
    .join("+");
}
