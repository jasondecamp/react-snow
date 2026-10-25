// Color ranges: CSS colors resolved to channels, then blended into even steps
// so each step can get its own pre-rendered sprite.

/** Red, green, and blue in 0–255; alpha in 0–1. */
export type Rgba = readonly [red: number, green: number, blue: number, alpha: number];

const black: Rgba = [0, 0, 0, 1];

/**
 * Resolve any CSS color by painting one pixel and reading it back, so every
 * syntax the browser understands works. An unparseable color resolves to
 * black, as a canvas fill would.
 */
export const parseColor = (doc: Document, color: string): Rgba => {
  const scratch = doc.createElement('canvas');
  scratch.width = 1;
  scratch.height = 1;
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (context == null) return black;
  context.fillStyle = '#000';
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 255] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue, alpha / 255];
};

/** `steps` CSS colors from `near` to `far` inclusive, blended channel by channel. */
export const blendColors = (near: Rgba, far: Rgba, steps: number): string[] => (
  Array.from({ length: steps }, (_, step) => {
    const t = steps > 1 ? step / (steps - 1) : 0;
    const blend = (i: 0 | 1 | 2 | 3) => near[i] + (far[i] - near[i]) * t;
    return `rgba(${Math.round(blend(0))}, ${Math.round(blend(1))}, ${Math.round(blend(2))}, ${Number(blend(3).toFixed(3))})`;
  })
);
