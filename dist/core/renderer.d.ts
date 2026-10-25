import type { Simulation } from './simulation.js';
import type { ColorRange } from './types.js';
export type Renderer = {
    /** Size the backing store to the canvas's CSS box at the given pixel ratio. */
    resize: (width: number, height: number, pixelRatio: number) => void;
    /** Rebuild the sprites for a new color or largest flake size. */
    setLook: (color: string | ColorRange, maxSize: number) => void;
    draw: (simulation: Pick<Simulation, 'forEachFlake'>) => void;
};
export declare const createRenderer: (canvas: HTMLCanvasElement) => Renderer;
//# sourceMappingURL=renderer.d.ts.map