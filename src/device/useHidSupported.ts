import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

export function useHidSupported(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => "hid" in navigator,
    () => true,
  );
}
