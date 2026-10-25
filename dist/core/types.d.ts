/** A `[min, max]` pair. Each flake picks a value within it. */
export type Range = readonly [min: number, max: number];
/** A `[near, far]` pair of CSS colors. Flakes blend from `near` (the closest) to `far` (the farthest) by depth. */
export type ColorRange = readonly [near: string, far: string];
/**
 * The look of a flake: the default soft dot, SVG markup, or a PNG URL. SVG and
 * PNG flakes are fitted inside a `size`-wide square, keeping their aspect
 * ratio, and stay invisible until they load. A source that fails to load (or a
 * `src` that isn't a PNG) falls back to the dot.
 *
 * - `{ svg }`: SVG markup. `currentColor` in it resolves to `color` (with the
 *   depth blend of a `[near, far]` pair); other colors are drawn as written.
 * - `{ src }`: a PNG URL (a `.png` path or a `data:image/png` URL). Only its
 *   alpha is used: `color` fills the shape, with the same depth blend.
 */
export type FlakeShape = 'dot' | {
    readonly svg: string;
} | {
    readonly src: string;
};
export type SnowOptions = {
    /** Average falling flakes per 100×100 CSS-pixel area. Grounded flakes don't count. `>= 0`, default `0.5`. */
    density?: number;
    /** Hard cap on falling flakes, however large the canvas. `>= 0`, default `1000`. */
    maxFlakes?: number;
    /** Base fall rate in CSS px per second. Bigger flakes fall faster than this, smaller ones slower. `>= 0`, default `60`. */
    speed?: number;
    /** How much each flake's fall rate varies around `speed`: `speed × (1 ± speedVariation)`. `0`–`1`, default `0.5`. */
    speedVariation?: number;
    /** Base horizontal drift in CSS px per second; negative drifts left. Default `0`. */
    wind?: number;
    /**
     * How much each flake's drift varies around `wind`, as a fraction of half the
     * fall speed: `wind ± windVariation × speed × 0.5`. Also scales each flake's
     * side-to-side sway. `0` falls in straight lines. `0`–`1`, default `0.5`.
     */
    windVariation?: number;
    /** Flake diameter range in CSS px. Bigger flakes are brighter and faster (depth). Default `[2, 6]`. */
    size?: Range;
    /** Flake opacity range, linked to size: the smallest flakes get the min. `0`–`1`, default `[0.4, 1]`. */
    opacity?: Range;
    /**
     * Any CSS color, or a `[near, far]` pair: the nearest flakes get `near`, the
     * farthest `far`, and depths between get a blend in 8 even steps. Alpha
     * multiplies with `opacity`. Default `'#fff'`.
     */
    color?: string | ColorRange;
    /** The look of each flake: `'dot'`, `{ svg }` markup, or a PNG `{ src }` tinted by `color`. Default `'dot'`. */
    flake?: FlakeShape;
    /** Whether each flake starts at a random angle and slowly spins as it falls. Invisible on the round dot. Default `false`. */
    rotate?: boolean;
    /** Whether flakes come to rest along the bottom edge before melting. Otherwise they fall out of view. Default `true`. */
    stick?: boolean;
    /** Seconds a landed flake rests before it melts. Default `[4, 10]`. */
    groundTime?: Range;
    /** Whether flakes shrink and fade as they melt (and occasionally melt mid-air). Otherwise they fade out quickly. Default `true`. */
    melt?: boolean;
    /** Whether falling flakes occasionally flicker. Default `false`. */
    twinkle?: boolean;
    /** Whether the pointer's horizontal position over the canvas bends the wind. Touch is ignored. Default `false`. */
    followPointer?: boolean;
    /** The wind push at the canvas edges with `followPointer`, as a multiple of `speed`. `>= 0`, default `1`. */
    pointerStrength?: number;
    /** Whether to cap fall and wind speed (and turn off twinkle and pointer wind) when the user prefers reduced motion. Default `true`. */
    respectReducedMotion?: boolean;
    /** Whether the sky starts full instead of filling from the top. Read once, when the instance is created. Default `false`. */
    prefill?: boolean;
};
export type ResolvedSnowOptions = Required<SnowOptions>;
export type SnowInstance = {
    /** Start spawning new flakes. Never clears or prefills; flakes already in play are untouched. */
    start: () => void;
    /** Stop spawning new flakes. Flakes in the air keep falling, land, and melt. */
    stop: () => void;
    /** Freeze every flake in place, still visible. Independent of spawning. */
    pause: () => void;
    /** Unfreeze after `pause()`. */
    resume: () => void;
    /** Remove every flake immediately. */
    clear: () => void;
    /** Merge new options into the running instance. An `undefined` value restores that option's default. */
    update: (options: SnowOptions) => void;
    /** Stop the loop, disconnect every observer and listener, and drop all flakes. The instance is unusable afterwards. */
    destroy: () => void;
};
//# sourceMappingURL=types.d.ts.map