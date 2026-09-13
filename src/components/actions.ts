import { type ButtonAction, encodeAction, STAGE_INDICES } from "@/core/commands";
import { MULTIMEDIA_USAGE, type MultimediaKey } from "@/core/hid-usages";
import { m } from "@/paraglide/messages";
import { MOUSE_LABELS } from "./labels";

export interface Choice {
  label: string;
  action: ButtonAction;
}

export interface ChoiceSection {
  title: string;
  items: MenuEntry[];
}

export type MenuEntry = Choice | ChoiceSection;

export const isSection = (entry: MenuEntry): entry is ChoiceSection => "items" in entry;

const choice = (label: string, action: ButtonAction): Choice => ({ label, action });

const media = (label: string, key: MultimediaKey): Choice =>
  choice(label, { type: "multimedia", usage: MULTIMEDIA_USAGE[key] });

export const ACTION_SECTIONS: ChoiceSection[] = [
  {
    title: m.mouse(),
    items: [
      choice(MOUSE_LABELS.left, { type: "mouse", button: "left" }),
      choice(MOUSE_LABELS.right, { type: "mouse", button: "right" }),
      choice(MOUSE_LABELS.middle, { type: "mouse", button: "middle" }),
      choice(MOUSE_LABELS.back, { type: "mouse", button: "back" }),
      choice(MOUSE_LABELS.forward, { type: "mouse", button: "forward" }),
    ],
  },
  {
    title: m.dpi(),
    items: [
      choice(m.dpiCycle(), { type: "dpi", op: "cycle" }),
      choice(m.dpiUp(), { type: "dpi", op: "plus" }),
      choice(m.dpiDown(), { type: "dpi", op: "minus" }),
      {
        title: m.dpiSetStage(),
        items: STAGE_INDICES.map((stage) =>
          choice(m.stage({ n: stage + 1 }), { type: "dpiSet", stage }),
        ),
      },
    ],
  },
  {
    title: m.media(),
    items: [
      media(m.playPause(), "playPause"),
      media(m.stop(), "stop"),
      media(m.prevTrack(), "prevTrack"),
      media(m.nextTrack(), "nextTrack"),
      media(m.volumeUp(), "volumeUp"),
      media(m.volumeDown(), "volumeDown"),
      media(m.mute(), "mute"),
      media(m.mediaPlayer(), "mediaPlayer"),
      media(m.email(), "email"),
      media(m.calculator(), "calculator"),
      media(m.myComputer(), "myComputer"),
      {
        title: m.browser(),
        items: [
          media(m.search(), "browserSearch"),
          media(m.home(), "browserHome"),
          media(m.back(), "browserBack"),
          media(m.forward(), "browserForward"),
          media(m.stop(), "browserStop"),
          media(m.refresh(), "browserRefresh"),
          media(m.favorites(), "browserFavorites"),
        ],
      },
    ],
  },
  {
    title: m.other(),
    items: [
      choice(m.rapidFire(), { type: "special", kind: "rapidFire" }),
      choice(m.actionDisabled(), { type: "disabled" }),
    ],
  },
];

const allChoices = (entries: MenuEntry[]): Choice[] =>
  entries.flatMap((entry) => (isSection(entry) ? allChoices(entry.items) : [entry]));

const CHOICE_BY_CODE: ReadonlyMap<number, Choice> = new Map(
  allChoices(ACTION_SECTIONS).map((c) => [encodeAction(c.action), c]),
);

export const choiceForAction = (action: ButtonAction): Choice | undefined =>
  CHOICE_BY_CODE.get(encodeAction(action));
