import { Heading } from "@astryxdesign/core/Heading";
import { Section } from "@astryxdesign/core/Section";
import { HStack, StackItem, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

export default function SettingSection({
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
      <HStack gap={8} align="start">
        <VStack gap={1} width={200}>
          <Heading level={3} accessibilityLevel={2}>
            {title}
          </Heading>
          <Text color="secondary">{description}</Text>
        </VStack>
        <StackItem size="fill">
          <VStack gap={3}>{children}</VStack>
        </StackItem>
      </HStack>
    </Section>
  );
}
