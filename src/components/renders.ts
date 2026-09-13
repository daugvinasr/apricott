import { type ButtonName, type ModelId, MODEL_NAMES } from "@/core/commands";

type ModelName = (typeof MODEL_NAMES)[ModelId];

export const RENDER_WIDTH = 203;
export const RENDER_HEIGHT = 390;

type Point = readonly [x: number, y: number];

export interface ButtonMarker {
  badgeY: number;
  target: Point;
}

export type Markers = Partial<Record<ButtonName, ButtonMarker>>;

export interface Render {
  src: string;
  markers: Markers;
}

const RENDERS = {
  GHERO: {
    src: "/mouseGhero.png",
    markers: {
      left: { badgeY: 81.2, target: [47.6, 107] },
      right: { badgeY: 81.2, target: [149.2, 107] },
      middle: { badgeY: 20, target: [96.5, 49.9] },
      back: { badgeY: 158.4, target: [4.1, 158.5] },
      forward: { badgeY: 211.4, target: [6.9, 212.5] },
      dpi: { badgeY: 143.6, target: [96.3, 143.9] },
    },
  },
  G23: {
    src: "/mouseG23.png",
    markers: {
      left: { badgeY: 73.3, target: [50.4, 99.6] },
      right: { badgeY: 73.3, target: [157.7, 100.2] },
      middle: { badgeY: 20, target: [102.7, 52] },
      back: { badgeY: 155.4, target: [4.2, 154.5] },
      forward: { badgeY: 211.7, target: [6.9, 212] },
      dpi: { badgeY: 152.5, target: [101.6, 139] },
    },
  },
  G24: {
    src: "/mouseG24.png",
    markers: {
      left: { badgeY: 75, target: [50.9, 101.3] },
      right: { badgeY: 75, target: [154.2, 101.3] },
      middle: { badgeY: 20, target: [100.7, 55.7] },
      back: { badgeY: 153.6, target: [6.9, 153.5] },
      forward: { badgeY: 207.6, target: [9, 207.8] },
      dpi: { badgeY: 139.3, target: [101.2, 137] },
    },
  },
  G23V2: {
    src: "/mouseG23V2.png",
    markers: {
      left: { badgeY: 73.6, target: [50.1, 100.9] },
      right: { badgeY: 73.6, target: [158, 101] },
      middle: { badgeY: 20, target: [101.6, 54.2] },
      back: { badgeY: 155.6, target: [4, 155.7] },
      forward: { badgeY: 212, target: [7, 212.8] },
    },
  },
  "029": {
    src: "/mouseG29.png",
    markers: {
      left: { badgeY: 71.9, target: [50, 99.3] },
      right: { badgeY: 71.8, target: [158.4, 99.3] },
      middle: { badgeY: 20, target: [101.9, 51.7] },
      back: { badgeY: 154.2, target: [2, 154.6] },
      forward: { badgeY: 210.9, target: [5.4, 211.8] },
    },
  },
  "039": {
    src: "/mouseG39.png",
    markers: {
      left: { badgeY: 72.8, target: [49.1, 100.3] },
      right: { badgeY: 72.8, target: [157.6, 100.4] },
      middle: { badgeY: 20, target: [101.1, 53.4] },
      back: { badgeY: 155.2, target: [2.3, 155.2] },
      forward: { badgeY: 211.9, target: [5.5, 212.8] },
    },
  },
} satisfies Partial<Record<ModelName, Render>>;

export const LINEUP = Object.entries(RENDERS).map(([name, { src }]) => ({ name, src }));

const hasRender = (name: ModelName): name is keyof typeof RENDERS => name in RENDERS;

export function renderFor(model: ModelId): Render | undefined {
  const name = MODEL_NAMES[model];
  return hasRender(name) ? RENDERS[name] : undefined;
}
