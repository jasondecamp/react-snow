// @vitest-environment node
import { defaultOptions, reduceMotion, resolveOptions } from './options.js';
import type { SnowOptions } from './types.js';

describe('resolveOptions', () => {
  it('fills in every default', () => {
    expect(resolveOptions({})).toEqual(defaultOptions);
  });

  it('treats undefined as the default', () => {
    expect(resolveOptions({ speed: undefined, size: undefined })).toEqual(defaultOptions);
  });

  it('clamps out-of-range values', () => {
    const options = resolveOptions({
      density: -1,
      speedVariation: 2,
      windVariation: -0.5,
      opacity: [-1, 3],
      maxFlakes: 10.7,
      speed: Number.NaN,
    });
    expect(options.density).toBe(0);
    expect(options.speedVariation).toBe(1);
    expect(options.windVariation).toBe(0);
    expect(options.opacity).toEqual([0, 1]);
    expect(options.maxFlakes).toBe(10);
    expect(options.speed).toBe(defaultOptions.speed);
  });

  it('orders reversed ranges', () => {
    expect(resolveOptions({ size: [8, 3] }).size).toEqual([3, 8]);
  });

  it('keeps SVG and image flakes and falls back to the dot for anything else', () => {
    expect(resolveOptions({ flake: { svg: '<svg/>' } }).flake).toEqual({ svg: '<svg/>' });
    expect(resolveOptions({ flake: { src: 'flake.png' } }).flake).toEqual({ src: 'flake.png' });
    expect(resolveOptions({ flake: { svg: 3 } as unknown as SnowOptions['flake'] }).flake).toBe('dot');
    expect(resolveOptions({ flake: 'star' as unknown as SnowOptions['flake'] }).flake).toBe('dot');
  });
});

describe('reduceMotion', () => {
  it('caps speed and wind and turns off twinkle, pointer wind, and rotation', () => {
    const options = reduceMotion(resolveOptions({ speed: 200, wind: -80, twinkle: true, followPointer: true, rotate: true }));
    expect(options.speed).toBe(20);
    expect(options.wind).toBe(-10);
    expect(options.twinkle).toBe(false);
    expect(options.followPointer).toBe(false);
    expect(options.rotate).toBe(false);
  });

  it('leaves slow snow alone', () => {
    const options = reduceMotion(resolveOptions({ speed: 10, wind: 5 }));
    expect(options.speed).toBe(10);
    expect(options.wind).toBe(5);
  });
});
