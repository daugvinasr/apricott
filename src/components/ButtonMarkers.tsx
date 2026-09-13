import { BUTTON_MATRIX, BUTTON_NAMES, type ButtonName } from "@/core/commands";
import * as stylex from "@stylexjs/stylex";
import { type ButtonMarker, type Markers, RENDER_WIDTH } from "./renders";

const BADGE_RADIUS = 9;
const TARGET_RADIUS = 4;
const BADGE_OFFSET = 50;

export const MARKER_GUTTER = BADGE_OFFSET + BADGE_RADIUS;
export const MARKED_RENDER_WIDTH = RENDER_WIDTH + 2 * MARKER_GUTTER;

const LEFT_BADGE_X = -BADGE_OFFSET;
const RIGHT_BADGE_X = RENDER_WIDTH + BADGE_OFFSET;

const BADGE_X = {
  left: LEFT_BADGE_X,
  right: RIGHT_BADGE_X,
  middle: RIGHT_BADGE_X,
  back: LEFT_BADGE_X,
  forward: LEFT_BADGE_X,
  dpi: RIGHT_BADGE_X,
} satisfies Record<ButtonName, number>;

const styles = stylex.create({
  markers: {
    opacity: 0,
    transitionProperty: "opacity",
    transitionDuration: {
      default: "0s",
      "@media (prefers-reduced-motion: no-preference)": "var(--duration-medium)",
    },
    transitionTimingFunction: "var(--ease-standard)",
  },
  visible: {
    opacity: 1,
  },
  marker: {
    transitionProperty: "opacity",
    transitionDuration: {
      default: "0s",
      "@media (prefers-reduced-motion: no-preference)": "var(--duration-fast)",
    },
    transitionTimingFunction: "var(--ease-standard)",
  },
  dimmed: {
    opacity: 0.25,
  },
  leader: {
    stroke: "var(--color-border-emphasized)",
    strokeWidth: 1,
    fill: "none",
  },
  target: {
    fill: "var(--color-background-inverted)",
    fillOpacity: 0.35,
  },
  badge: {
    fill: "var(--color-background-inverted)",
  },
  label: {
    fill: "var(--color-background-surface)",
    fontFamily: "var(--font-family-body)",
    fontWeight: "var(--font-weight-semibold)",
    fontSize: 10,
    textAnchor: "middle",
    dominantBaseline: "central",
    userSelect: "none",
  },
});

function leaderPoints(bx: number, by: number, [tx, ty]: ButtonMarker["target"]): string {
  const elbowX = tx - Math.sign(tx - bx) * Math.abs(ty - by);
  return `${bx},${by} ${elbowX},${by} ${tx},${ty}`;
}

function Badge({ cx, cy, name }: { cx: number; cy: number; name: ButtonName }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={BADGE_RADIUS} {...stylex.props(styles.badge)} />
      <text x={cx} y={cy} {...stylex.props(styles.label)}>
        {BUTTON_MATRIX[name] + 1}
      </text>
    </>
  );
}

function Marker({
  name,
  marker,
  isDimmed,
}: {
  name: ButtonName;
  marker: ButtonMarker;
  isDimmed: boolean;
}) {
  const bx = BADGE_X[name];
  const by = marker.badgeY;
  const [tx, ty] = marker.target;

  return (
    <g {...stylex.props(styles.marker, isDimmed && styles.dimmed)}>
      <polyline points={leaderPoints(bx, by, marker.target)} {...stylex.props(styles.leader)} />
      <circle cx={tx} cy={ty} r={TARGET_RADIUS} {...stylex.props(styles.target)} />
      <Badge cx={bx} cy={by} name={name} />
    </g>
  );
}

export function ButtonBadge({ name }: { name: ButtonName }) {
  const size = 2 * BADGE_RADIUS;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <Badge cx={BADGE_RADIUS} cy={BADGE_RADIUS} name={name} />
    </svg>
  );
}

export function ButtonMarkers({
  markers,
  isVisible,
  highlightedButton,
}: {
  markers: Markers;
  isVisible: boolean;
  highlightedButton?: ButtonName;
}) {
  return (
    <g {...stylex.props(styles.markers, isVisible && styles.visible)}>
      {BUTTON_NAMES.map((name) => {
        const marker = markers[name];
        return (
          marker && (
            <Marker
              key={name}
              name={name}
              marker={marker}
              isDimmed={highlightedButton !== undefined && highlightedButton !== name}
            />
          )
        );
      })}
    </g>
  );
}
