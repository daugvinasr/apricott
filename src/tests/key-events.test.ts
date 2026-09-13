import { expect, it } from "vite-plus/test";
import { KEY_USAGE, isModifierUsage } from "@/core/hid-usages";
import { type KeyEventLike, recordedKeyAction } from "@/core/key-events";

const event = (type: string, code: string, held: Partial<KeyEventLike> = {}): KeyEventLike => ({
  type,
  code,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  ...held,
});

it("binds a regular key on keydown with the held modifiers", () => {
  expect(recordedKeyAction(event("keydown", "KeyA", { ctrlKey: true, shiftKey: true }))).toEqual({
    type: "key",
    usage: KEY_USAGE.a,
    usage2: 0,
    modifiers: ["controlLeft", "shiftLeft"],
  });
  expect(recordedKeyAction(event("keyup", "KeyA"))).toBeUndefined();
});

it("binds a lone modifier on keyup", () => {
  expect(recordedKeyAction(event("keydown", "ControlRight"))).toBeUndefined();
  expect(recordedKeyAction(event("keyup", "ControlRight"))).toEqual({
    type: "key",
    usage: KEY_USAGE.controlRight,
    usage2: 0,
    modifiers: [],
  });
});

it("ignores keys without a HID usage", () => {
  expect(recordedKeyAction(event("keydown", "Fn"))).toBeUndefined();
});

it("recognises the modifier usage range", () => {
  expect(isModifierUsage(KEY_USAGE.controlLeft)).toBe(true);
  expect(isModifierUsage(KEY_USAGE.metaRight)).toBe(true);
  expect(isModifierUsage(KEY_USAGE.a)).toBe(false);
});
