import { expect, it } from "vite-plus/test";
import { KEY_USAGE, isModifierUsage, type KeyName } from "@/core/hid-usages";
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

const down = (...names: KeyName[]) => new Set(names);

it("binds a regular key on keydown with the held modifiers", () => {
  expect(
    recordedKeyAction(
      event("keydown", "KeyA", { ctrlKey: true, shiftKey: true }),
      down("controlLeft", "shiftLeft"),
    ),
  ).toEqual({
    type: "key",
    usage: KEY_USAGE.a,
    usage2: 0,
    modifiers: ["controlLeft", "shiftLeft"],
  });
  expect(recordedKeyAction(event("keyup", "KeyA"), down())).toBeUndefined();
});

it("binds a lone modifier on keyup", () => {
  expect(recordedKeyAction(event("keydown", "ControlRight"), down("controlRight"))).toBeUndefined();
  expect(recordedKeyAction(event("keyup", "ControlRight"), down())).toEqual({
    type: "key",
    usage: KEY_USAGE.controlRight,
    usage2: 0,
    modifiers: [],
  });
});

it("keeps a right modifier as a key usage", () => {
  expect(
    recordedKeyAction(
      event("keydown", "KeyA", { ctrlKey: true, shiftKey: true }),
      down("controlRight", "shiftLeft"),
    ),
  ).toEqual({
    type: "key",
    usage: KEY_USAGE.controlRight,
    usage2: KEY_USAGE.a,
    modifiers: ["shiftLeft"],
  });
});

it("binds two right modifiers with a key as three keys", () => {
  expect(
    recordedKeyAction(
      event("keydown", "KeyA", { ctrlKey: true, shiftKey: true }),
      down("controlRight", "shiftRight"),
    ),
  ).toEqual({
    type: "keys3",
    usages: [KEY_USAGE.controlRight, KEY_USAGE.shiftRight, KEY_USAGE.a],
  });
  expect(
    recordedKeyAction(
      event("keydown", "KeyA", { ctrlKey: true, shiftKey: true, altKey: true }),
      down("controlRight", "shiftRight", "altLeft"),
    ),
  ).toBeUndefined();
});

it("treats a modifier with no recorded keydown as left", () => {
  expect(recordedKeyAction(event("keydown", "KeyA", { altKey: true }), down())).toEqual({
    type: "key",
    usage: KEY_USAGE.a,
    usage2: 0,
    modifiers: ["altLeft"],
  });
  expect(
    recordedKeyAction(
      event("keydown", "KeyA", { ctrlKey: true }),
      down("controlLeft", "controlRight"),
    ),
  ).toEqual({
    type: "key",
    usage: KEY_USAGE.a,
    usage2: 0,
    modifiers: ["controlLeft"],
  });
});

it("ignores keys without a HID usage", () => {
  expect(recordedKeyAction(event("keydown", "Fn"), down())).toBeUndefined();
});

it("recognises the modifier usage range", () => {
  expect(isModifierUsage(KEY_USAGE.controlLeft)).toBe(true);
  expect(isModifierUsage(KEY_USAGE.metaRight)).toBe(true);
  expect(isModifierUsage(KEY_USAGE.a)).toBe(false);
});
