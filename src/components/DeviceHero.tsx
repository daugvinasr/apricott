import { m } from "@/paraglide/messages";
import { type ButtonName, type Identity, MODEL_NAMES, Sensor } from "@/core/commands";
import { Heading } from "@astryxdesign/core/Heading";
import { Section } from "@astryxdesign/core/Section";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { MARKED_RENDER_WIDTH } from "./ButtonMarkers";
import { MissingRender, ModelRender } from "./ModelRender";
import { SENSOR_LABELS } from "./labels";
import { renderFor } from "./renders";

function linkLabel(link: Identity["link"]): string {
  if (link.kind === "wired") return m.linkWired();
  return link.receiver8k ? m.linkWireless8k() : m.linkWireless();
}

export default function DeviceHero({
  identity,
  showButtons = false,
  highlightedButton,
}: {
  identity: Identity;
  showButtons?: boolean;
  highlightedButton?: ButtonName;
}) {
  const name = MODEL_NAMES[identity.model];
  const render = renderFor(identity.model);

  return (
    <VStack gap={6}>
      <Section variant="muted" padding={8}>
        <VStack align="center">
          <VStack width={MARKED_RENDER_WIDTH}>
            {render ? (
              <ModelRender
                src={render.src}
                name={name}
                markers={render.markers}
                areMarkersVisible={showButtons}
                highlightedButton={highlightedButton}
              />
            ) : (
              <MissingRender name={name} />
            )}
          </VStack>
        </VStack>
      </Section>
      <VStack gap={1}>
        <HStack gap={2} align="center">
          <Heading level={1} type="display-2">
            {name}
          </Heading>
          {identity.sensor === Sensor.PAW3950 && <Token label={m.pro()} />}
        </HStack>
        <Text color="secondary">
          {m.sensorAndLink({
            sensor: SENSOR_LABELS[identity.sensor],
            link: linkLabel(identity.link),
          })}
        </Text>
      </VStack>
    </VStack>
  );
}
