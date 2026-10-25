import { vi } from 'vitest';
import type { SnowInstance, SnowOptions } from '../core/types.js';

// A stand-in for createSnow, so React tests can assert on the calls the hook
// and component make. Use with:
//   vi.mock('../core/createSnow.js', () => import('../test/fakeSnow.js'));

export type FakeInstance = SnowInstance & { options: SnowOptions; destroyed: boolean };

export const instances: FakeInstance[] = [];

/** Instances not yet destroyed. */
export const liveInstances = () => instances.filter(({ destroyed }) => !destroyed);

export const createSnow = (_canvas: HTMLCanvasElement, options: SnowOptions): SnowInstance => {
  const instance: FakeInstance = {
    options,
    destroyed: false,
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    clear: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(() => {
      instance.destroyed = true;
    }),
  };
  instances.push(instance);
  return instance;
};
