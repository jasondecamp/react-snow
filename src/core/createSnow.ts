import { reduceMotion, resolveOptions } from './options.js';
import { createRenderer } from './renderer.js';
import { createSimulation } from './simulation.js';
import type { ResolvedSnowOptions, SnowInstance, SnowOptions } from './types.js';

/**
 * Animate snow on a canvas. The canvas is sized by its own CSS box (tracked
 * with a ResizeObserver); position it with CSS. The instance starts idle: call
 * `start()` to begin spawning.
 */
export const createSnow = (canvas: HTMLCanvasElement, initialOptions: SnowOptions = {}): SnowInstance => {
  const view = canvas.ownerDocument.defaultView;
  let rawOptions: SnowOptions = { ...initialOptions };
  let options: ResolvedSnowOptions = resolveOptions(rawOptions);
  let reducedMotion = false;
  let paused = false;
  let visible = true;
  let destroyed = false;
  let width = 0;
  let height = 0;
  let pendingPrefill = options.prefill;
  let frame: number | null = null;
  let lastTime: number | null = null;

  const simulation = createSimulation();
  const renderer = createRenderer(canvas);

  const effectiveOptions = () => (reducedMotion && options.respectReducedMotion ? reduceMotion(options) : options);

  const draw = () => renderer.draw(simulation);

  const shouldRun = () => !destroyed && !paused && visible && width > 0 && height > 0 && !simulation.isIdle();

  const tick = (time: number) => {
    frame = null;
    const dt = lastTime == null ? 0 : (time - lastTime) / 1000;
    lastTime = time;
    simulation.step(dt);
    draw();
    if (shouldRun()) frame = view?.requestAnimationFrame(tick) ?? null;
  };

  const stopLoop = () => {
    if (frame != null) view?.cancelAnimationFrame(frame);
    frame = null;
  };

  /** Schedule the loop if it should be running and isn't. */
  const wake = () => {
    if (frame != null || !shouldRun()) return;
    lastTime = null;
    frame = view?.requestAnimationFrame(tick) ?? null;
  };

  const updatePointerListener = () => {
    const listening = !destroyed && effectiveOptions().followPointer;
    view?.removeEventListener('pointermove', onPointerMove);
    view?.document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    if (listening) {
      view?.addEventListener('pointermove', onPointerMove, { passive: true });
      view?.document.documentElement.addEventListener('pointerleave', onPointerLeave);
    } else {
      simulation.setPointerWind(0);
    }
  };

  const applyOptions = () => {
    const effective = effectiveOptions();
    simulation.setOptions(effective);
    renderer.setLook(effective.color, effective.size[1]);
    updatePointerListener();
  };

  // Pointer wind: the pointer's horizontal position across the canvas maps to
  // a push from -pointerStrength × speed (left edge) to +pointerStrength × speed
  // (right edge). Touch is ignored: dragging on a touch screen is scrolling.
  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside || rect.width === 0) {
      simulation.setPointerWind(0);
      return;
    }
    const position = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const effective = effectiveOptions();
    simulation.setPointerWind(position * effective.pointerStrength * effective.speed);
  }

  function onPointerLeave() {
    simulation.setPointerWind(0);
  }

  const measure = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.resize(width, height, view?.devicePixelRatio ?? 1);
    simulation.setBounds(width, height);
    if (pendingPrefill && width > 0 && height > 0) {
      pendingPrefill = false;
      simulation.prefill();
    }
    // Resizing clears the canvas, so repaint even while paused.
    draw();
    wake();
  };

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
  resizeObserver?.observe(canvas);

  const intersectionObserver = typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry == null) return;
      visible = entry.isIntersecting;
      if (visible) wake();
      else stopLoop();
    });
  intersectionObserver?.observe(canvas);

  const reducedMotionQuery = view?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
  const onReducedMotionChange = () => {
    reducedMotion = reducedMotionQuery?.matches ?? false;
    applyOptions();
  };
  reducedMotion = reducedMotionQuery?.matches ?? false;
  reducedMotionQuery?.addEventListener('change', onReducedMotionChange);

  applyOptions();
  measure();

  return {
    start: () => {
      if (destroyed) return;
      simulation.setSpawning(true);
      wake();
    },
    stop: () => {
      simulation.setSpawning(false);
    },
    pause: () => {
      paused = true;
      stopLoop();
    },
    resume: () => {
      paused = false;
      wake();
    },
    clear: () => {
      simulation.clear();
      draw();
    },
    update: (nextOptions) => {
      if (destroyed) return;
      rawOptions = { ...rawOptions, ...nextOptions };
      options = resolveOptions(rawOptions);
      applyOptions();
      draw();
      wake();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      stopLoop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      reducedMotionQuery?.removeEventListener('change', onReducedMotionChange);
      updatePointerListener();
      simulation.clear();
      draw();
    },
  };
};
