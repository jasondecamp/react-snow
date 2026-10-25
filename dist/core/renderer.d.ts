import type { Simulation } from './simulation.js';
import type { ColorRange, FlakeShape } from './types.js';
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
/** `onLoad` is called when an SVG or image flake finishes loading (or fails), so the caller can redraw. */
export declare const createRenderer: (canvas: HTMLCanvasElement, onLoad?: () => void) => Renderer;
//# sourceMappingURL=renderer.d.ts.map