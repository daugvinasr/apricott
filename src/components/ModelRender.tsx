import { m } from "@/paraglide/messages";
import type { ButtonName } from "@/core/commands";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Stack";
import * as stylex from "@stylexjs/stylex";
import { ButtonMarkers, MARKER_GUTTER } from "./ButtonMarkers";
import { type Markers, RENDER_HEIGHT, RENDER_WIDTH } from "./renders";

const rise = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(var(--spacing-4))" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
  render: {
    display: "block",
    width: "100%",
    height: "auto",
    animationName: {
      default: "none",
      "@media (prefers-reduced-motion: no-preference)": rise,
    },
    animationDuration: "var(--duration-slow-min)",
    animationTimingFunction: "var(--ease-standard)",
    animationFillMode: "backwards",
  },
  delay: (ms: number) => ({ animationDelay: `${ms}ms` }),
  image: {
    filter: "drop-shadow(0 var(--spacing-6) var(--spacing-8) var(--color-shadow))",
  },
});

export function ModelRender({
  src,
  name,
  markers,
  areMarkersVisible = false,
  highlightedButton,
  hasShadow = true,
  delayMs = 0,
}: {
  src: string;
  name: string;
  markers?: Markers;
  areMarkersVisible?: boolean;
  highlightedButton?: ButtonName;
  hasShadow?: boolean;
  delayMs?: number;
}) {
  const label = areMarkersVisible ? m.mouseButtonLayout({ name }) : m.mouseTopView({ name });
  const gutter = markers ? MARKER_GUTTER : 0;

  return (
    <svg
      viewBox={`${-gutter} 0 ${RENDER_WIDTH + 2 * gutter} ${RENDER_HEIGHT}`}
      role="img"
      aria-label={label}
      {...stylex.props(styles.render, styles.delay(delayMs))}
    >
      <image
        href={src}
        width={RENDER_WIDTH}
        height={RENDER_HEIGHT}
        {...stylex.props(hasShadow && styles.image)}
      />
      {markers && (
        <ButtonMarkers
          markers={markers}
          isVisible={areMarkersVisible}
          highlightedButton={highlightedButton}
        />
      )}
    </svg>
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
