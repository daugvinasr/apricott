import { m } from "@/paraglide/messages";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Stack";
import * as stylex from "@stylexjs/stylex";

const rise = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(var(--spacing-4))" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
  render: {
    display: "block",
    width: "100%",
    height: "auto",
    filter: "drop-shadow(0 var(--spacing-6) var(--spacing-8) var(--color-shadow))",
    animationName: {
      default: "none",
      "@media (prefers-reduced-motion: no-preference)": rise,
    },
    animationDuration: "var(--duration-slow-min)",
    animationTimingFunction: "var(--ease-standard)",
    animationFillMode: "backwards",
  },
  delay: (ms: number) => ({ animationDelay: `${ms}ms` }),
});

export function ModelRender({
  src,
  name,
  delayMs = 0,
}: {
  src: string;
  name: string;
  delayMs?: number;
}) {
  return (
    <img
      src={src}
      alt={m.mouseTopView({ name })}
      width={203}
      height={390}
      {...stylex.props(styles.render, styles.delay(delayMs))}
    />
  );
}

export function MissingRender({ name }: { name: string }) {
  return (
    <VStack align="center" justify="center" minHeight={320}>
      <Heading level={2} type="display-1" color="secondary">
        {name}
      </Heading>
    </VStack>
  );
}
