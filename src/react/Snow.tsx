import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { SnowOptions } from '../core/types.js';
import { useSnow } from './useSnow.js';

export type SnowProps = SnowOptions & {
  /** Whether new flakes keep spawning. Turning it off lets the flakes in play land and melt. Default `true`. */
  falling?: boolean;
  /** Whether every flake is frozen in place. Default `false`. */
  paused?: boolean;
  className?: string;
  /** Merged over the overlay defaults. */
  style?: CSSProperties;
};

// The library ships no CSS, so the overlay defaults are inline.
const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
};

/**
 * Declarative snow: a canvas that fills its nearest positioned ancestor.
 * `falling` and `paused` are its state; every other prop is a snow option.
 */
export const Snow = ({ falling = true, paused = false, className, style, ...options }: SnowProps) => {
  const { ref, start, stop, pause, resume } = useSnow(options);

  useEffect(() => {
    if (falling) start();
    else stop();
  }, [falling, start, stop]);

  useEffect(() => {
    if (paused) pause();
    else resume();
  }, [paused, pause, resume]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ ...overlayStyle, ...style }}
      aria-hidden
    />
  );
};
