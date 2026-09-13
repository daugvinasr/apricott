import { hex } from "@/core/bytes";
import { type ButtonAction, encodeAction } from "@/core/commands";
import { m } from "@/paraglide/messages";
import { Kbd } from "@astryxdesign/core/Kbd";
import { choiceForAction } from "./actions";
import { type ShortcutAction, shortcutKeys } from "./shortcut";

function describe(action: Exclude<ButtonAction, ShortcutAction>): string {
  const known = choiceForAction(action);
  if (known) return known.label;

  switch (action.type) {
    case "macro":
      return m.macro({ n: action.bufferId });
    case "multimedia":
      return m.mediaKeyCode({ code: hex(action.usage, 4) });
    default:
      return m.unknownAction({ code: hex(encodeAction(action), 8) });
  }
}

export default function ActionLabel({ action }: { action: ButtonAction }) {
  switch (action.type) {
    case "key":
    case "keys3":
      return <Kbd keys={shortcutKeys(action)} />;
    default:
      return describe(action);
  }
}
