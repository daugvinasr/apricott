import { Heading } from "@astryxdesign/core/Heading";
import { Section } from "@astryxdesign/core/Section";
import { VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

export default function TabPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Section variant="transparent" padding={6}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3} accessibilityLevel={2}>
            {title}
          </Heading>
          <Text color="secondary">{description}</Text>
        </VStack>
        <VStack gap={3}>{children}</VStack>
      </VStack>
    </Section>
  );
}
