import { expect, it } from "vite-plus/test";
import { KEY_USAGE } from "@/core/hid-usages";
import { shortcutKeys } from "@/components/shortcut";

it("formats key actions for Kbd", () => {
  expect(
    shortcutKeys({
      type: "key",
      usage: KEY_USAGE.a,
      usage2: 0,
      modifiers: ["controlLeft", "shiftLeft"],
    }),
  ).toBe("ctrl+shift+a");
  expect(
    shortcutKeys({
      type: "key",
      usage: KEY_USAGE.arrowUp,
      usage2: KEY_USAGE.digit1,
      modifiers: [],
    }),
  ).toBe("up+1");
  expect(shortcutKeys({ type: "key", usage: KEY_USAGE.numpad5, usage2: 0, modifiers: [] })).toBe(
    "num 5",
  );
  expect(shortcutKeys({ type: "key", usage: KEY_USAGE.pageUp, usage2: 0, modifiers: [] })).toBe(
    "page up",
  );
});

it("formats three-key actions", () => {
  expect(shortcutKeys({ type: "keys3", usages: [KEY_USAGE.a, KEY_USAGE.b, KEY_USAGE.c] })).toBe(
    "a+b+c",
  );
});

it("skips empty key slots", () => {
  expect(shortcutKeys({ type: "keys3", usages: [KEY_USAGE.a, 0, 0] })).toBe("a");
  expect(
    shortcutKeys({ type: "key", usage: 0, usage2: 0, modifiers: ["controlLeft", "altLeft"] }),
  ).toBe("ctrl+alt");
});
