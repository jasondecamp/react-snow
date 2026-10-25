import type { ResolvedSnowOptions, SnowOptions } from './types.js';
export declare const defaultOptions: ResolvedSnowOptions;
/** Fill in defaults, drop `undefined` values, and clamp everything into its valid range. */
export declare const resolveOptions: (options: SnowOptions) => ResolvedSnowOptions;
/** The options actually simulated when the user prefers reduced motion. */
export declare const reduceMotion: (options: ResolvedSnowOptions) => ResolvedSnowOptions;
//# sourceMappingURL=options.d.ts.map