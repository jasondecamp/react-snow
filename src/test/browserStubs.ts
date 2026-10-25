import { vi } from 'vitest';

// jsdom has no canvas, layout, observers, or matchMedia. These stubs supply
// just enough of each for createSnow, and expose handles to drive them.

type FrameCallback = (time: number) => void;

export type BrowserStubs = {
  /** Run the pending animation frame, advancing the clock by `ms`. */
  frame: (ms?: number) => void;
  pendingFrames: () => number;
  /** Fire every ResizeObserver callback. */
  resize: () => void;
  setVisible: (visible: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  observers: { resize: { disconnected: boolean }[]; intersection: { disconnected: boolean }[] };
  context: Record<string, unknown>;
  restore: () => void;
};

export const stubBrowser = ({ width = 800, height = 400 } = {}): BrowserStubs => {
  let now = 0;
  let nextId = 1;
  const frames = new Map<number, FrameCallback>();
  const resizeCallbacks: (() => void)[] = [];
  const intersectionCallbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
  const observers: BrowserStubs['observers'] = { resize: [], intersection: [] };
  let reducedMotion = false;
  const mediaListeners = new Set<() => void>();

  const context: Record<string, unknown> = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 255, 255, 255]) })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
  };

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height);

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });

  vi.stubGlobal('ResizeObserver', class {
    record = { disconnected: false };
    constructor(callback: () => void) {
      resizeCallbacks.push(callback);
      observers.resize.push(this.record);
    }
    observe() {}
    disconnect() {
      this.record.disconnected = true;
    }
  });

  vi.stubGlobal('IntersectionObserver', class {
    record = { disconnected: false };
    constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
      intersectionCallbacks.push(callback);
      observers.intersection.push(this.record);
    }
    observe() {}
    disconnect() {
      this.record.disconnected = true;
    }
  });

  window.matchMedia = vi.fn(() => ({
    get matches() {
      return reducedMotion;
    },
    addEventListener: (_type: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => mediaListeners.delete(listener),
  })) as unknown as typeof window.matchMedia;

  return {
    frame: (ms = 16) => {
      now += ms;
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, callback]) => callback(now));
    },
    pendingFrames: () => frames.size,
    resize: () => resizeCallbacks.forEach((callback) => callback()),
    setVisible: (visible) => intersectionCallbacks.forEach((callback) => callback([{ isIntersecting: visible }])),
    setReducedMotion: (reduced) => {
      reducedMotion = reduced;
      mediaListeners.forEach((listener) => listener());
    },
    observers,
    context,
    restore: () => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    },
  };
};
