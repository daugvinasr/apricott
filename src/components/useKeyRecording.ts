import type { ButtonAction } from "@/core/commands";
import { type KeyName, keyNameFromCode } from "@/core/hid-usages";
import { recordedKeyAction } from "@/core/key-events";
import { useEffect, useState } from "react";

export function useKeyRecording(onCommit: (action: ButtonAction) => void) {
  const [isRecording, setRecording] = useState(false);
  const cancel = () => setRecording(false);

  useEffect(() => {
    if (!isRecording) return;

    const down = new Set<KeyName>();
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code === "Escape") {
        cancel();
        return;
      }
      const name = keyNameFromCode(e.code);
      if (name && e.type === "keydown") down.add(name);
      if (name && e.type === "keyup") down.delete(name);

      const next = recordedKeyAction(e, down);
      if (next) {
        cancel();
        onCommit(next);
      }
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKey, true);
    window.addEventListener("blur", cancel);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKey, true);
      window.removeEventListener("blur", cancel);
    };
  }, [isRecording, onCommit]);

  return {
    isRecording,
    start: () => setRecording(true),
    cancel,
  };
}
