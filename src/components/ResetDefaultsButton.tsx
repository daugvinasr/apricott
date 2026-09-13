import { m } from "@/paraglide/messages";
import { useDeviceBusy } from "@/device/useDeviceSetting";
import { useResetDefaults } from "@/device/useResetDefaults";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack, Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { useState } from "react";
import SettingError from "./SettingError";

export default function ResetDefaultsButton() {
  const [isOpen, setOpen] = useState(false);
  const busy = useDeviceBusy();
  const { reset, clearError, isPending, progress, error } = useResetDefaults();

  const open = () => {
    clearError();
    setOpen(true);
  };
  const close = () => setOpen(false);

  return (
    <>
      <Button label={m.resetDefaultsButton()} variant="ghost" isDisabled={busy} onClick={open} />
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
                <VStack gap={3}>
                  <Text>{m.resetDefaultsConfirmDescription()}</Text>
                  <SettingError error={error} />
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack gap={2} hAlign="end">
                  <Button label={m.cancel()} variant="ghost" onClick={close} />
                  <Button
                    label={m.resetDefaultsButton()}
                    variant="destructive"
                    onClick={() => reset(undefined, { onSuccess: close })}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        )}
      </Dialog>
    </>
  );
}
