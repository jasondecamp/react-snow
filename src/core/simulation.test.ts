// @vitest-environment node
import { seededRandom } from '../test/seededRandom.js';
import { resolveOptions } from './options.js';
import { createSimulation } from './simulation.js';
import type { SnowOptions } from './types.js';

const width = 1000;
const height = 500;
// density 1 on 1000×500 is 50 falling flakes.
const target = 50;

const setup = (options: SnowOptions = {}) => {
  const simulation = createSimulation({
    random: seededRandom(42),
    options: resolveOptions({ density: 1, melt: false, ...options }),
  });
  simulation.setBounds(width, height);
  return simulation;
};

const flakes = (simulation: ReturnType<typeof createSimulation>) => {
  const all: { x: number; y: number; size: number; alpha: number }[] = [];
  simulation.forEachFlake((x, y, size, alpha) => all.push({ x, y, size, alpha }));
  return all;
};

const run = (simulation: ReturnType<typeof createSimulation>, seconds: number, fps = 60) => {
  for (let i = 0; i < seconds * fps; i++) simulation.step(1 / fps);
};

describe('createSimulation', () => {
  it('is idle until spawning starts', () => {
    const simulation = setup();
    simulation.step(1 / 60);
    expect(simulation.flakeCount).toBe(0);
    expect(simulation.isIdle()).toBe(true);
  });

  it('fills an empty sky from above the top edge', () => {
    const simulation = setup();
    simulation.setSpawning(true);
    simulation.step(0);
    expect(simulation.flakeCount).toBe(target);
    expect(flakes(simulation).every(({ y }) => y < 0)).toBe(true);
  });

  it('keeps the falling count at the density target', () => {
    const simulation = setup({ stick: false });
    simulation.setSpawning(true);
    run(simulation, 30);
    expect(simulation.flakeCount).toBe(target);
  });

  it('caps falling flakes at maxFlakes', () => {
    const simulation = setup({ maxFlakes: 10 });
    simulation.setSpawning(true);
    simulation.step(0);
    expect(simulation.flakeCount).toBe(10);
  });

  it('prefills the sky inside the canvas', () => {
    const simulation = setup();
    simulation.prefill();
    const all = flakes(simulation);
    expect(all).toHaveLength(target);
    expect(all.every(({ y }) => y >= 0 && y <= height)).toBe(true);
  });

  it('lets flakes in play finish after spawning stops, then idles', () => {
    const simulation = setup({ groundTime: [1, 2] });
    simulation.setSpawning(true);
    run(simulation, 5);
    simulation.setSpawning(false);
    const before = simulation.flakeCount;
    simulation.step(1 / 60);
    expect(simulation.flakeCount).toBeLessThanOrEqual(before);
    expect(simulation.isIdle()).toBe(false);
    run(simulation, 60);
    expect(simulation.flakeCount).toBe(0);
    expect(simulation.isIdle()).toBe(true);
  });

  it('starting again keeps grounded flakes and adds new ones', () => {
    const simulation = setup({ groundTime: [100, 100], speed: 400 });
    simulation.setSpawning(true);
    run(simulation, 3);
    simulation.setSpawning(false);
    run(simulation, 3);
    const grounded = simulation.groundedCount;
    expect(grounded).toBeGreaterThan(0);
    simulation.setSpawning(true);
    simulation.step(0);
    expect(simulation.groundedCount).toBe(grounded);
    expect(flakes(simulation).filter(({ y }) => y < 0).length).toBeGreaterThan(0);
  });

  it('rests landed flakes along the bottom edge', () => {
    const simulation = setup({ groundTime: [100, 100], speed: 400, speedVariation: 0 });
    simulation.setSpawning(true);
    run(simulation, 4);
    const resting = flakes(simulation).filter(({ y }) => y > height - 10);
    expect(resting.length).toBeGreaterThan(0);
    expect(resting.every(({ y, size }) => y + size / 2 <= height)).toBe(true);
  });

  it('melts the oldest grounded flakes past the ground cap', () => {
    // The cap is 2 per 100px of width: 20 here.
    const simulation = setup({ groundTime: [1000, 1000], speed: 400, density: 4 });
    simulation.setSpawning(true);
    run(simulation, 10);
    expect(simulation.groundedCount).toBe(20);
  });

  it('drops flakes below the bottom edge when stick is off', () => {
    const simulation = setup({ stick: false, speed: 400 });
    simulation.setSpawning(true);
    run(simulation, 4);
    simulation.setSpawning(false);
    run(simulation, 4);
    expect(simulation.flakeCount).toBe(0);
  });

  it('falls straight down without wind or variation', () => {
    const simulation = setup({ wind: 0, windVariation: 0 });
    simulation.setSpawning(true);
    simulation.step(0);
    const start = flakes(simulation).map(({ x }) => x);
    run(simulation, 1);
    expect(flakes(simulation).map(({ x }) => x)).toEqual(start);
  });

  it('moves the same distance at 60Hz and 120Hz', () => {
    const at60 = setup({ speedVariation: 0, windVariation: 0, stick: false });
    const at120 = setup({ speedVariation: 0, windVariation: 0, stick: false });
    at60.setSpawning(true);
    at120.setSpawning(true);
    at60.step(0);
    at120.step(0);
    at60.setSpawning(false);
    at120.setSpawning(false);
    run(at60, 1, 60);
    run(at120, 1, 120);
    const y60 = flakes(at60).map(({ y }) => y);
    const y120 = flakes(at120).map(({ y }) => y);
    y60.forEach((y, index) => expect(y120[index]).toBeCloseTo(y, 6));
  });

  it('clamps long steps so flakes do not teleport', () => {
    const simulation = setup({ speedVariation: 0, windVariation: 0, stick: false });
    simulation.setSpawning(true);
    simulation.step(0);
    simulation.setSpawning(false);
    const before = flakes(simulation).map(({ y }) => y);
    simulation.step(30);
    const after = flakes(simulation).map(({ y }) => y);
    // Fastest flake: speed 60 × depth factor 1.3 × 0.1s max step.
    after.forEach((y, index) => expect(y - (before[index] ?? 0)).toBeLessThanOrEqual(60 * 1.3 * 0.1 + 1e-9));
  });

  it('eases the pointer wind instead of snapping', () => {
    const simulation = setup({ wind: 0, windVariation: 0 });
    simulation.setSpawning(true);
    simulation.step(0);
    simulation.setSpawning(false);
    const before = flakes(simulation).map(({ x }) => x);
    simulation.setPointerWind(100);
    simulation.step(1 / 60);
    const pushed = flakes(simulation).map(({ x }, index) => x - (before[index] ?? 0));
    // A full push would move up to 100 × 1.3 / 60 ≈ 2.2px in one frame.
    expect(pushed.every((dx) => dx > 0 && dx < 0.2)).toBe(true);
  });

  it('clears every flake', () => {
    const simulation = setup();
    simulation.setSpawning(true);
    run(simulation, 1);
    simulation.clear();
    expect(simulation.flakeCount).toBe(0);
  });

  it('links opacity to size', () => {
    const simulation = setup({ size: [2, 6], opacity: [0.4, 1], twinkle: false });
    simulation.prefill();
    const all = flakes(simulation).sort((a, b) => a.size - b.size);
    const alphas = all.map(({ alpha }) => alpha);
    expect(alphas).toEqual([...alphas].sort((a, b) => a - b));
  });

  it('spins flakes in the air only with rotate', () => {
    const angles = (simulation: ReturnType<typeof createSimulation>) => {
      const all: number[] = [];
      simulation.forEachFlake((_x, _y, _size, _alpha, _depth, angle) => all.push(angle));
      return all;
    };
    const still = setup();
    still.setSpawning(true);
    run(still, 1);
    expect(angles(still).every((angle) => angle === 0)).toBe(true);

    const spinning = setup({ rotate: true });
    spinning.setSpawning(true);
    run(spinning, 1);
    const before = angles(spinning);
    spinning.step(0.1);
    const after = angles(spinning);
    expect(after.every((angle, index) => angle !== before[index])).toBe(true);
  });

  it('stops spinning flakes once they land', () => {
    const simulation = setup({ rotate: true, groundTime: [100, 100] });
    simulation.setSpawning(true);
    run(simulation, 30);
    simulation.setSpawning(false);
    run(simulation, 30);
    expect(simulation.groundedCount).toBeGreaterThan(0);
    const before: number[] = [];
    simulation.forEachFlake((_x, _y, _size, _alpha, _depth, angle) => before.push(angle));
    simulation.step(0.1);
    const after: number[] = [];
    simulation.forEachFlake((_x, _y, _size, _alpha, _depth, angle) => after.push(angle));
    expect(after).toEqual(before);
  });
});
