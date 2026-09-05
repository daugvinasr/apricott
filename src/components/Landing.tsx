import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ModelRender } from "./ModelRender";
import { LINEUP } from "./renders";

const STAGGER_MS = 70;

export default function Landing({ onConnect }: { onConnect: () => void }) {
  const hidSupported = "hid" in navigator;

  return (
    <VStack gap={10} align="center" paddingBlock={10}>
      <HStack gap={4} justify="center" align="end">
        {LINEUP.map((mouse, i) => (
          <VStack key={mouse.name} gap={3} align="center" width={112}>
            <ModelRender src={mouse.src} name={mouse.name} delayMs={i * STAGGER_MS} />
            <Text type="supporting">{mouse.name}</Text>
          </VStack>
        ))}
      </HStack>
      <VStack gap={3} align="center" maxWidth={480}>
        <Heading level={1} type="display-2" justify="center">
          Connect a mouse
        </Heading>
        <Text color="secondary" justify="center" textWrap="balance" display="block">
          Plug in the mouse or its receiver, then pick it from the browser prompt. Settings are read
          from the device and saved back as you change them.
        </Text>
      </VStack>
      {hidSupported ? (
        <Button label="Connect mouse" variant="primary" clickAction={onConnect} />
      ) : (
        <Banner
          status="warning"
          title="This browser can't reach USB devices"
          description="Open this page in Chrome or Edge on a desktop computer."
        />
      )}
    </VStack>
  );
}
