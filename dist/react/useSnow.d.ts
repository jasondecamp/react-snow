import type { SnowOptions } from '../core/types.js';
export type SnowControls = {
    /** Attach to the `<canvas>` to animate. */
    ref: (canvas: HTMLCanvasElement | null) => (() => void) | undefined;
    start: () => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    clear: () => void;
};
/**
 * Imperative snow. Attach `ref` to a `<canvas>` and call `start()` to begin.
 * Options are live: re-render with new values and only the changed ones are
 * applied. The instance lives as long as the canvas is mounted.
 */
export declare const useSnow: (options?: SnowOptions) => SnowControls;
//# sourceMappingURL=useSnow.d.ts.map