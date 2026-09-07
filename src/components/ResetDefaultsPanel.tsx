import { m } from "@/paraglide/messages";
import { useDeviceBusy } from "@/device/useDeviceSetting";
import { useResetDefaults } from "@/device/useResetDefaults";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack, Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { useState } from "react";
import SettingError from "./SettingError";
import SettingSection from "./SettingSection";

export default function ResetDefaultsPanel() {
  const [isOpen, setOpen] = useState(false);
  const busy = useDeviceBusy();
  const { reset, isPending, progress, error } = useResetDefaults();

  const close = () => setOpen(false);

  return (
    <SettingSection title={m.resetDefaults()} description={m.resetDefaultsDescription()}>
      <HStack>
        <Button label={m.resetDefaultsButton()} isDisabled={busy} onClick={() => setOpen(true)} />
      </HStack>
      <SettingError error={error} />
      <Dialog isOpen={isOpen} onOpenChange={setOpen} purpose="required">
        {isPending ? (
          <Layout
            content={
              <LayoutContent>
                <ProgressBar
                  label={m.resetDefaultsProgress()}
                  value={progress.done}
                  max={progress.total}
                  hasValueLabel
                />
              </LayoutContent>
            }
          />
        ) : (
          <Layout
            header={<DialogHeader title={m.resetDefaultsConfirmTitle()} onOpenChange={setOpen} />}
            content={
              <LayoutContent>
                <Text>{m.resetDefaultsConfirmDescription()}</Text>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack gap={2} hAlign="end">
                  <Button label={m.cancel()} variant="ghost" onClick={close} />
                  <Button
                    label={m.resetDefaultsButton()}
                    variant="destructive"
                    onClick={() => reset(undefined, { onSettled: close })}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        )}
      </Dialog>
    </SettingSection>
  );
}
