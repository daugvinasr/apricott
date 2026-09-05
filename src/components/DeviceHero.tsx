import { type Identity, MODEL_NAMES, Sensor } from "@/core/commands";
import { Heading } from "@astryxdesign/core/Heading";
import { Section } from "@astryxdesign/core/Section";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { MissingRender, ModelRender } from "./ModelRender";
import { SENSOR_LABELS } from "./labels";
import { renderFor } from "./renders";

function linkLabel(link: Identity["link"]): string {
  if (link.kind === "wired") return "wired";
  return link.receiver8k ? "wireless, 8K receiver" : "wireless";
}

export default function DeviceHero({ identity }: { identity: Identity }) {
  const name = MODEL_NAMES[identity.model];
  const src = renderFor(identity.model);

  return (
    <VStack gap={6}>
      <Section variant="muted" padding={8}>
        <VStack align="center">
          <VStack width={200}>
            {src ? <ModelRender src={src} name={name} /> : <MissingRender name={name} />}
          </VStack>
        </VStack>
      </Section>
      <VStack gap={1}>
        <HStack gap={2} align="center">
          <Heading level={1} type="display-2">
            {name}
          </Heading>
          {identity.sensor === Sensor.PAW3950 && <Token label="Pro" />}
        </HStack>
        <Text color="secondary">
          {SENSOR_LABELS[identity.sensor]}, {linkLabel(identity.link)}
        </Text>
      </VStack>
    </VStack>
  );
}
