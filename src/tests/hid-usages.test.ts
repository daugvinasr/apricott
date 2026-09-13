import { expect, it } from "vite-plus/test";
import { KEY_BY_USAGE, KEY_USAGE, keyNameFromCode } from "@/core/hid-usages";

it("maps KeyboardEvent codes to HID key names", () => {
  expect(keyNameFromCode("KeyA")).toBe("a");
  expect(keyNameFromCode("Digit1")).toBe("digit1");
  expect(keyNameFromCode("ArrowUp")).toBe("arrowUp");
  expect(keyNameFromCode("ControlLeft")).toBe("controlLeft");
  expect(keyNameFromCode("NumpadDecimal")).toBe("numpadDecimal");
  expect(keyNameFromCode("Space")).toBe("space");
});

it("ignores codes without a HID usage", () => {
  expect(keyNameFromCode("Keyboard")).toBeUndefined();
  expect(keyNameFromCode("Fn")).toBeUndefined();
  expect(keyNameFromCode("Constructor")).toBeUndefined();
  expect(keyNameFromCode("")).toBeUndefined();
});

it("inverts usages back to key names", () => {
  expect(KEY_BY_USAGE.get(KEY_USAGE.enter)).toBe("enter");
  expect(KEY_BY_USAGE.get(0x00)).toBeUndefined();
});
