/** Red, green, and blue in 0–255; alpha in 0–1. */
export type Rgba = readonly [red: number, green: number, blue: number, alpha: number];
/**
 * Resolve any CSS color by painting one pixel and reading it back, so every
 * syntax the browser understands works. An unparseable color resolves to
 * black, as a canvas fill would.
 */
export declare const parseColor: (doc: Document, color: string) => Rgba;
/** `steps` CSS colors from `near` to `far` inclusive, blended channel by channel. */
export declare const blendColors: (near: Rgba, far: Rgba, steps: number) => string[];
//# sourceMappingURL=colors.d.ts.map