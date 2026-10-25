import type { ResolvedSnowOptions } from './types.js';
/** Called for every visible flake: center position and diameter in CSS px, alpha, and depth (0 far to 1 near). */
export type FlakeVisitor = (x: number, y: number, size: number, alpha: number, depth: number) => void;
export type Simulation = {
    setOptions: (options: ResolvedSnowOptions) => void;
    setBounds: (width: number, height: number) => void;
    setSpawning: (spawning: boolean) => void;
    /** The wind push the pointer asks for, in px per second. The actual push eases toward it. */
    setPointerWind: (target: number) => void;
    step: (dt: number) => void;
    /** Fill the sky with flakes already in flight. */
    prefill: () => void;
    clear: () => void;
    /** True when nothing will change until spawning starts again. */
    isIdle: () => boolean;
    forEachFlake: (visitor: FlakeVisitor) => void;
    /** Number of flakes in play (falling, grounded, or melting). */
    readonly flakeCount: number;
    /** Number of flakes resting on the ground (not yet melting). */
    readonly groundedCount: number;
};
export type SimulationOptions = {
    random?: () => number;
    options?: ResolvedSnowOptions;
};
/** Larger steps (a tab returning from the background) are clamped so flakes don't teleport. */
export declare const maxStep = 0.1;
export declare const createSimulation: ({ random, options: initialOptions }?: SimulationOptions) => Simulation;
//# sourceMappingURL=simulation.d.ts.map