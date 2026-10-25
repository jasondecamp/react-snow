import { blendColors, parseColor } from './colors.js';
import type { FlakeVisitor, Simulation } from './simulation.js';
import { createDotSprite, createImageSprite, isPngUrl, loadImage, svgDataUrl } from './sprites.js';
import type { Sprite } from './sprites.js';
import type { ColorRange, FlakeShape } from './types.js';

// Draws simulation state onto a 2D canvas. Coordinates are CSS pixels; the
// backing store is scaled by devicePixelRatio so flakes stay sharp.

export type Renderer = {
  /** Size the backing store to the canvas's CSS box at the given pixel ratio. */
  resize: (width: number, height: number, pixelRatio: number) => void;
  /**
   * Rebuild the sprites for a new color, largest flake size, or flake shape.
   * SVG and image flakes load asynchronously: a new source draws nothing until
   * it's ready, while a new color for a loaded SVG keeps the old sprites until
   * the new ones are.
   */
  setLook: (color: string | ColorRange, maxSize: number, flake?: FlakeShape) => void;
  draw: (simulation: Pick<Simulation, 'forEachFlake'>) => void;
};

// Sprites render at twice the largest drawn size so every draw downscales.
const spriteSupersample = 2;

// A color range is drawn as this many evenly spaced blends, one sprite each.
const colorSteps = 8;

const sourceKey = (flake: FlakeShape) => {
  if (flake === 'dot') return 'dot';
  return 'svg' in flake ? `svg:${flake.svg}` : `src:${flake.src}`;
};

/** `onLoad` is called when an SVG or image flake finishes loading (or fails), so the caller can redraw. */
export const createRenderer = (canvas: HTMLCanvasElement, onLoad: () => void = () => {}): Renderer => {
  const context = canvas.getContext('2d');
  const doc = canvas.ownerDocument;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let nearColor = '';
  let farColor = '';
  let maxSize = 0;
  let source = 'dot';
  // The sprite colors, nearest first: one for a single color, else colorSteps.
  let colors: string[] = [];
  // What the sprites are drawn from. Dots use the colors. SVG images come one
  // per color, already colored; a PNG is one image, tinted with each color.
  // Loading draws nothing.
  let mode: 'dot' | 'loading' | 'svg' | 'png' = 'dot';
  let images: HTMLImageElement[] = [];
  // Counts loads, so a load that finishes after a newer one started is ignored.
  let loads = 0;
  let warnedSource = '';
  // Nearest first. One sprite for a single color; empty when nothing can draw.
  let sprites: Sprite[] = [];

  const buildSprites = () => {
    sprites = [];
    if (mode === 'loading') return;
    const pixelSize = Math.max(2, Math.ceil(maxSize * pixelRatio * spriteSupersample));
    const built: Sprite[] = [];
    if (mode === 'svg') {
      for (const image of images) {
        const sprite = createImageSprite(doc, image, pixelSize);
        if (sprite == null) return;
        built.push(sprite);
      }
    } else if (mode === 'png') {
      const [image] = images;
      if (image == null) return;
      for (const color of colors) {
        const sprite = createImageSprite(doc, image, pixelSize, color);
        if (sprite == null) return;
        built.push(sprite);
      }
    } else {
      for (const color of colors) {
        const sprite = createDotSprite(doc, color, pixelSize);
        if (sprite == null) return;
        built.push(sprite);
      }
    }
    sprites = built;
  };

  const load = (flake: Exclude<FlakeShape, 'dot'>) => {
    const id = ++loads;
    const loading = 'svg' in flake
      ? colors.map((color) => {
        const url = svgDataUrl(flake.svg, color);
        return url == null ? Promise.reject(new Error('Not valid SVG markup')) : loadImage(doc, url);
      })
      : [isPngUrl(flake.src) ? loadImage(doc, flake.src) : Promise.reject(new Error(`Not a PNG: ${flake.src.slice(0, 100)}`))];
    Promise.all(loading).then(
      (loaded) => {
        if (id !== loads) return;
        mode = 'svg' in flake ? 'svg' : 'png';
        images = loaded;
        buildSprites();
        onLoad();
      },
      (error: unknown) => {
        if (id !== loads) return;
        mode = 'dot';
        images = [];
        buildSprites();
        if (warnedSource !== source) {
          warnedSource = source;
          console.warn('react-snow: the flake failed to load, so the default dot is drawn instead.', error);
        }
        onLoad();
      },
    );
  };

  // Defined once so drawing a frame allocates nothing. Depth 1 (nearest) maps
  // to the first sprite; the depth range splits evenly across the sprites.
  const drawFlake: FlakeVisitor = (x, y, size, alpha, depth, angle) => {
    const step = Math.min(sprites.length - 1, Math.floor((1 - depth) * sprites.length));
    const sprite = sprites[step];
    if (context == null || sprite == null || alpha <= 0 || size <= 0) return;
    context.globalAlpha = alpha;
    if (angle === 0) {
      context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      return;
    }
    // Rotate about the flake's center, then restore the frame's transform.
    const cos = Math.cos(angle) * pixelRatio;
    const sin = Math.sin(angle) * pixelRatio;
    context.setTransform(cos, sin, -sin, cos, x * pixelRatio, y * pixelRatio);
    context.drawImage(sprite, -size / 2, -size / 2, size, size);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  return {
    resize: (nextWidth, nextHeight, nextPixelRatio) => {
      const ratioChanged = nextPixelRatio !== pixelRatio;
      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextPixelRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      if (ratioChanged) buildSprites();
    },
    setLook: (color, nextMaxSize, flake = 'dot') => {
      const [near, far] = typeof color === 'string' ? [color, color] : color;
      const nextSource = sourceKey(flake);
      const colorChanged = near !== nearColor || far !== farColor;
      const sourceChanged = nextSource !== source;
      if (!colorChanged && !sourceChanged && nextMaxSize === maxSize) return;
      maxSize = nextMaxSize;
      if (colorChanged) {
        nearColor = near;
        farColor = far;
        colors = near === far ? [near] : blendColors(parseColor(doc, near), parseColor(doc, far), colorSteps);
      }
      if (sourceChanged) {
        source = nextSource;
        loads++;
        mode = flake === 'dot' ? 'dot' : 'loading';
        images = [];
      }
      // A PNG is tinted from the one loaded image, so only a new source reloads it.
      if (flake !== 'dot' && (sourceChanged || (colorChanged && 'svg' in flake))) load(flake);
      buildSprites();
    },
    draw: (simulation) => {
      if (context == null) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      simulation.forEachFlake(drawFlake);
      context.globalAlpha = 1;
    },
  };
};
