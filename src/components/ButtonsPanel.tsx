import { m } from "@/paraglide/messages";
import { BUTTON_NAMES, type ButtonName, encodeAction } from "@/core/commands";
import { buttonSetting } from "@/device/settings";
import { useDeviceSetting } from "@/device/useDeviceSetting";
import { Button } from "@astryxdesign/core/Button";
import {
  DropdownMenu,
  DropdownMenuDivider,
  DropdownMenuItem,
  DropdownMenuSubMenu,
} from "@astryxdesign/core/DropdownMenu";
import { CheckIndicator } from "@astryxdesign/core/Indicator";
import { List, ListItem } from "@astryxdesign/core/List";
import ActionLabel from "./ActionLabel";
import {
  ACTION_SECTIONS,
  type Choice,
  type ChoiceSection,
  choiceForAction,
  isSection,
} from "./actions";
import { ButtonBadge } from "./ButtonMarkers";
import { BUTTON_LABELS } from "./labels";
import SettingError from "./SettingError";
import TabPanel from "./TabPanel";
import { useKeyRecording } from "./useKeyRecording";

const MENU_WIDTH = 220;

function ActionSubMenu({
  section,
  selected,
  onSelect,
}: {
  section: ChoiceSection;
  selected: Choice | undefined;
  onSelect: (choice: Choice) => void;
}) {
  return (
    <DropdownMenuSubMenu label={section.title}>
      {section.items.map((entry) =>
        isSection(entry) ? (
          <ActionSubMenu
            key={entry.title}
            section={entry}
            selected={selected}
            onSelect={onSelect}
          />
        ) : (
          <DropdownMenuItem
            key={encodeAction(entry.action)}
            label={entry.label}
            endContent={<CheckIndicator state={entry === selected ? "checked" : "unchecked"} />}
            onClick={() => onSelect(entry)}
          />
        ),
      )}
    </DropdownMenuSubMenu>
  );
}

function ButtonRow({
  name,
  onHover,
}: {
  name: ButtonName;
  onHover: (name: ButtonName | undefined) => void;
}) {
  const setting = useDeviceSetting(buttonSetting(name));
  const recording = useKeyRecording(setting.set);
  const label = BUTTON_LABELS[name];

  const action = setting.shown;
  const selected = action && choiceForAction(action);

  return (
    <ListItem
      label={label}
      onPointerEnter={() => onHover(name)}
      onPointerLeave={() => onHover(undefined)}
      description={setting.error && <SettingError error={setting.error} />}
      startContent={<ButtonBadge name={name} />}
      endContent={
        recording.isRecording ? (
          <Button
            label={m.pressKeys()}
            tooltip={m.recordShortcutHint()}
            variant="primary"
            width={MENU_WIDTH}
            onClick={recording.cancel}
          />
        ) : (
          <DropdownMenu
            button={{
              label: m.buttonAction({ name: label }),
              children: action && <ActionLabel action={action} />,
              isDisabled: setting.isDisabled,
              width: MENU_WIDTH,
            }}
          >
            <DropdownMenuItem label={m.keyboardShortcut()} onClick={recording.start} />
            <DropdownMenuDivider />
            {ACTION_SECTIONS.map((section) => (
              <ActionSubMenu
                key={section.title}
                section={section}
                selected={selected}
                onSelect={(next) => setting.set(next.action)}
              />
            ))}
          </DropdownMenu>
        )
      }
    />
  );
}

export default function ButtonsPanel({
  onHover,
}: {
  onHover: (name: ButtonName | undefined) => void;
}) {
  return (
    <TabPanel title={m.buttons()} description={m.buttonsDescription()}>
      <List hasDividers>
        {BUTTON_NAMES.map((name) => (
          <ButtonRow key={name} name={name} onHover={onHover} />
        ))}
      </List>
    </TabPanel>
  );
}
