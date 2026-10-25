import { defaultOptions } from './options.js';
import type { ResolvedSnowOptions } from './types.js';

// The pure snow simulation: flakes, physics, and ground state, advanced by
// step(dt). It never touches the DOM; the random source is injected so tests
// are deterministic.

type FlakeState = 'falling' | 'grounded' | 'melting';

type Flake = {
  x: number;
  y: number;
  /** 0 (far: small, dim, slow) to 1 (near: big, bright, fast). */
  depth: number;
  /** Per-flake offsets in [-1, 1], scaled by the current variation options every step. */
  speedOffset: number;
  windOffset: number;
  swayPhase: number;
  /** Radians per second. */
  swayRate: number;
  /** Radians, drawn only with `rotate`. */
  angle: number;
  /** Radians per second, signed. */
  spinRate: number;
  /** How far above the bottom edge the flake comes to rest. */
  restOffset: number;
  state: FlakeState;
  /** Whether a melting flake is still in the air (and moving). */
  airborne: boolean;
  /** Grounded: seconds left before melting. Melting: progress from 0 to 1. */
  timer: number;
  meltDuration: number;
  /** Whether the melt shrinks the flake as well as fading it. */
  shrink: boolean;
  /** Seconds of flicker left (twinkle). */
  twinkle: number;
  /** Landing order, so the ground cap melts the oldest first. */
  landedAt: number;
};

/**
 * Called for every visible flake: center position and diameter in CSS px,
 * alpha, depth (0 far to 1 near), and rotation in radians (0 without `rotate`).
 */
export type FlakeVisitor = (x: number, y: number, size: number, alpha: number, depth: number, angle: number) => void;

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
export const maxStep = 0.1;

const areaUnit = 100 * 100;
const groundCapPer100px = 2;
const minFallFraction = 0.15;
const maxSwayAmplitude = 12;
const meltDuration = 0.75;
const fadeDuration = 0.25;
const midAirMeltRate = 0.02;
const twinkleRate = 0.4;
const twinkleFlickerHz = 15;
const pointerEaseSeconds = 0.4;
const maxRestOffset = 3;
// Spin rates in radians per second, before the depth factor.
const minSpinRate = Math.PI / 6;
const maxSpinRate = Math.PI / 2;

const lerp = (min: number, max: number, t: number) => min + (max - min) * t;

/** Speed multiplier from depth: far flakes move at 0.7×, near ones at 1.3×. */
const depthFactor = (depth: number) => 0.7 + 0.6 * depth;

export const createSimulation = ({ random = Math.random, options: initialOptions = defaultOptions }: SimulationOptions = {}): Simulation => {
  let options = initialOptions;
  let width = 0;
  let height = 0;
  let spawning = false;
  let pointerWind = 0;
  let pointerWindTarget = 0;
  let landings = 0;
  const flakes: Flake[] = [];
  const pool: Flake[] = [];

  const signed = () => random() * 2 - 1;

  const flakeSize = (flake: Flake) => lerp(options.size[0], options.size[1], flake.depth);

  const targetCount = () => Math.min(options.maxFlakes, Math.round((options.density * width * height) / areaUnit));

  const groundCap = () => Math.max(1, Math.round((groundCapPer100px * width) / 100));

  const swayAmplitude = (flake: Flake) => options.windVariation * maxSwayAmplitude * depthFactor(flake.depth);

  const fallSpeed = (flake: Flake) => {
    const base = options.speed * depthFactor(flake.depth);
    return Math.max(base * minFallFraction, base * (1 + options.speedVariation * flake.speedOffset));
  };

  const driftSpeed = (flake: Flake) => (
    (options.wind + options.windVariation * options.speed * 0.5 * flake.windOffset + pointerWind) * depthFactor(flake.depth)
  );

  /** Spawn above the top edge, up to `spread` px higher, or anywhere in the sky when `spread` is null. */
  const spawn = (spread: number | null) => {
    const flake = pool.pop() ?? ({} as Flake);
    flake.depth = random();
    flake.speedOffset = signed();
    flake.windOffset = signed();
    flake.swayPhase = random() * Math.PI * 2;
    flake.swayRate = lerp(0.15, 0.45, random()) * Math.PI * 2;
    flake.restOffset = random() * maxRestOffset;
    flake.angle = random() * Math.PI * 2;
    flake.spinRate = lerp(minSpinRate, maxSpinRate, random()) * (random() < 0.5 ? -1 : 1);
    flake.x = random() * width;
    flake.y = spread == null ? random() * height : -flakeSize(flake) - random() * spread;
    flake.state = 'falling';
    flake.airborne = true;
    flake.timer = 0;
    flake.meltDuration = 0;
    flake.shrink = false;
    flake.twinkle = 0;
    flake.landedAt = 0;
    flakes.push(flake);
  };

  const remove = (index: number) => {
    const last = flakes.pop();
    if (last == null) return;
    if (index < flakes.length) {
      pool.push(flakes[index] as Flake);
      flakes[index] = last;
    } else {
      pool.push(last);
    }
  };

  const startMelting = (flake: Flake) => {
    flake.state = 'melting';
    flake.timer = 0;
    flake.shrink = options.melt;
    flake.meltDuration = options.melt ? meltDuration : fadeDuration;
  };

  const groundY = (flake: Flake) => height - flake.restOffset - flakeSize(flake) / 2;

  const move = (flake: Flake, dt: number) => {
    flake.y += fallSpeed(flake) * dt;
    flake.x += driftSpeed(flake) * dt;
    flake.swayPhase += flake.swayRate * dt;
    flake.angle = (flake.angle + flake.spinRate * depthFactor(flake.depth) * dt) % (Math.PI * 2);
    const margin = flakeSize(flake) + swayAmplitude(flake);
    if (flake.x > width + margin) flake.x = -margin;
    else if (flake.x < -margin) flake.x = width + margin;
  };

  const stepFalling = (flake: Flake, index: number, dt: number) => {
    move(flake, dt);
    if (options.stick && flake.y >= groundY(flake)) {
      // Bake the sway into the resting position so the flake doesn't jump.
      flake.x += swayAmplitude(flake) * Math.sin(flake.swayPhase);
      flake.y = groundY(flake);
      flake.state = 'grounded';
      flake.airborne = false;
      flake.twinkle = 0;
      flake.timer = lerp(options.groundTime[0], options.groundTime[1], random());
      flake.landedAt = ++landings;
      return;
    }
    if (!options.stick && flake.y - flakeSize(flake) > height) {
      remove(index);
      return;
    }
    if (options.melt && flake.depth < 0.5 && random() < midAirMeltRate * dt) {
      startMelting(flake);
      return;
    }
    if (flake.twinkle > 0) {
      flake.twinkle = Math.max(0, flake.twinkle - dt);
    } else if (options.twinkle && random() < twinkleRate * dt) {
      flake.twinkle = lerp(0.1, 0.3, random());
    }
  };

  const groundedCount = () => {
    let count = 0;
    for (const flake of flakes) {
      if (flake.state === 'grounded') count++;
    }
    return count;
  };

  const enforceGroundCap = () => {
    let grounded = groundedCount();
    const cap = groundCap();
    while (grounded > cap) {
      let oldest: Flake | null = null;
      for (const flake of flakes) {
        if (flake.state === 'grounded' && (oldest == null || flake.landedAt < oldest.landedAt)) oldest = flake;
      }
      if (oldest == null) return;
      startMelting(oldest);
      grounded--;
    }
  };

  const fallingCount = () => {
    let count = 0;
    for (const flake of flakes) {
      if (flake.state === 'falling') count++;
    }
    return count;
  };

  const spawnDeficit = () => {
    const target = targetCount();
    const deficit = target - fallingCount();
    if (deficit <= 0) return;
    // Replacing a flake or two spawns just above the top edge; refilling an
    // empty sky spreads the new flakes up to a full height above it, so they
    // drift in gradually instead of arriving as one wave.
    const spread = height * (deficit / target);
    for (let i = 0; i < deficit; i++) spawn(spread);
  };

  return {
    setOptions: (next) => {
      options = next;
    },
    setBounds: (nextWidth, nextHeight) => {
      width = Math.max(0, nextWidth);
      height = Math.max(0, nextHeight);
      for (let i = flakes.length - 1; i >= 0; i--) {
        const flake = flakes[i] as Flake;
        if (flake.airborne) continue;
        if (flake.x > width) remove(i);
        else flake.y = groundY(flake);
      }
    },
    setSpawning: (next) => {
      spawning = next;
    },
    setPointerWind: (target) => {
      pointerWindTarget = target;
    },
    step: (rawDt) => {
      const dt = Math.min(Math.max(rawDt, 0), maxStep);
      pointerWind += (pointerWindTarget - pointerWind) * (1 - Math.exp(-dt / pointerEaseSeconds));
      if (spawning && width > 0 && height > 0) spawnDeficit();
      for (let i = flakes.length - 1; i >= 0; i--) {
        const flake = flakes[i] as Flake;
        if (flake.state === 'falling') {
          stepFalling(flake, i, dt);
        } else if (flake.state === 'grounded') {
          flake.timer -= dt;
          if (flake.timer <= 0) startMelting(flake);
        } else {
          if (flake.airborne) move(flake, dt);
          flake.timer += dt / flake.meltDuration;
          if (flake.timer >= 1) remove(i);
        }
      }
      enforceGroundCap();
    },
    prefill: () => {
      const deficit = targetCount() - fallingCount();
      for (let i = 0; i < deficit; i++) spawn(null);
    },
    clear: () => {
      while (flakes.length > 0) remove(flakes.length - 1);
    },
    isIdle: () => !spawning && flakes.length === 0,
    forEachFlake: (visitor) => {
      for (const flake of flakes) {
        const progress = flake.state === 'melting' ? Math.min(1, flake.timer) : 0;
        const scale = flake.shrink ? 1 - progress * 0.7 : 1;
        const flicker = flake.twinkle > 0 && Math.floor(flake.twinkle * twinkleFlickerHz) % 2 === 0 ? 0.15 : 1;
        const alpha = lerp(options.opacity[0], options.opacity[1], flake.depth) * (1 - progress) * flicker;
        const x = flake.airborne ? flake.x + swayAmplitude(flake) * Math.sin(flake.swayPhase) : flake.x;
        visitor(x, flake.y, flakeSize(flake) * scale, alpha, flake.depth, options.rotate ? flake.angle : 0);
      }
    },
    get flakeCount() {
      return flakes.length;
    },
    get groundedCount() {
      return groundedCount();
    },
  };
};
