import type { CSSProperties } from 'react';
import type { SnowOptions } from '../core/types.js';
export type SnowProps = SnowOptions & {
    /** Whether new flakes keep spawning. Turning it off lets the flakes in play land and melt. Default `true`. */
    falling?: boolean;
    /** Whether every flake is frozen in place. Default `false`. */
    paused?: boolean;
    className?: string;
    /** Merged over the overlay defaults. */
    style?: CSSProperties;
};
/**
 * Declarative snow: a canvas that fills its nearest positioned ancestor.
 * `falling` and `paused` are its state; every other prop is a snow option.
 */
export declare const Snow: ({ falling, paused, className, style, ...options }: SnowProps) => import("react").JSX.Element;
//# sourceMappingURL=Snow.d.ts.map