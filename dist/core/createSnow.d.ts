import type { SnowInstance, SnowOptions } from './types.js';
/**
 * Animate snow on a canvas. The canvas is sized by its own CSS box (tracked
 * with a ResizeObserver); position it with CSS. The instance starts idle: call
 * `start()` to begin spawning.
 */
export declare const createSnow: (canvas: HTMLCanvasElement, initialOptions?: SnowOptions) => SnowInstance;
//# sourceMappingURL=createSnow.d.ts.map