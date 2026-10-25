import type { Range, ResolvedSnowOptions, SnowOptions } from './types.js';

export const defaultOptions: ResolvedSnowOptions = {
  density: 0.5,
  maxFlakes: 1000,
  speed: 60,
  speedVariation: 0.5,
  wind: 0,
  windVariation: 0.5,
  size: [2, 6],
  opacity: [0.4, 1],
  color: '#fff',
  flake: 'dot',
  stick: true,
  groundTime: [4, 10],
  melt: true,
  twinkle: false,
  followPointer: false,
  pointerStrength: 1,
  respectReducedMotion: true,
  prefill: false,
};

// Speed caps applied when the user prefers reduced motion.
const reducedMotionMaxSpeed = 20;
const reducedMotionMaxWind = 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

const resolveRange = (range: Range, fallback: Range, min: number, max: number): Range => {
  const low = clamp(finiteOr(range[0], fallback[0]), min, max);
  const high = clamp(finiteOr(range[1], fallback[1]), min, max);
  return low <= high ? [low, high] : [high, low];
};

/** Fill in defaults, drop `undefined` values, and clamp everything into its valid range. */
export const resolveOptions = (options: SnowOptions): ResolvedSnowOptions => {
  const defined = Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as SnowOptions;
  const merged = { ...defaultOptions, ...defined };
  return {
    ...merged,
    density: Math.max(0, finiteOr(merged.density, defaultOptions.density)),
    maxFlakes: Math.max(0, Math.floor(finiteOr(merged.maxFlakes, defaultOptions.maxFlakes))),
    speed: Math.max(0, finiteOr(merged.speed, defaultOptions.speed)),
    speedVariation: clamp(finiteOr(merged.speedVariation, defaultOptions.speedVariation), 0, 1),
    wind: finiteOr(merged.wind, defaultOptions.wind),
    windVariation: clamp(finiteOr(merged.windVariation, defaultOptions.windVariation), 0, 1),
    size: resolveRange(merged.size, defaultOptions.size, 0.5, 256),
    opacity: resolveRange(merged.opacity, defaultOptions.opacity, 0, 1),
    groundTime: resolveRange(merged.groundTime, defaultOptions.groundTime, 0, Infinity),
    pointerStrength: Math.max(0, finiteOr(merged.pointerStrength, defaultOptions.pointerStrength)),
  };
};

/** The options actually simulated when the user prefers reduced motion. */
export const reduceMotion = (options: ResolvedSnowOptions): ResolvedSnowOptions => ({
  ...options,
  speed: Math.min(options.speed, reducedMotionMaxSpeed),
  wind: clamp(options.wind, -reducedMotionMaxWind, reducedMotionMaxWind),
  twinkle: false,
  followPointer: false,
});
