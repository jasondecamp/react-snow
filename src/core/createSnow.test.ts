import { stubBrowser } from '../test/browserStubs.js';
import type { BrowserStubs } from '../test/browserStubs.js';
import { createSnow } from './createSnow.js';

let browser: BrowserStubs;
let canvas: HTMLCanvasElement;

beforeEach(() => {
  browser = stubBrowser();
  canvas = document.createElement('canvas');
  document.body.append(canvas);
});

afterEach(() => {
  canvas.remove();
  browser.restore();
});

describe('createSnow', () => {
  it('sizes the backing store to the CSS box at the pixel ratio', () => {
    window.devicePixelRatio = 2;
    createSnow(canvas);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(800);
    window.devicePixelRatio = 1;
  });

  it('starts idle', () => {
    createSnow(canvas);
    expect(browser.pendingFrames()).toBe(0);
  });

  it('animates after start and draws flakes', () => {
    const snow = createSnow(canvas, { prefill: true });
    snow.start();
    expect(browser.pendingFrames()).toBe(1);
    browser.frame();
    expect(browser.context.drawImage).toHaveBeenCalled();
    expect(browser.pendingFrames()).toBe(1);
  });

  it('pauses and resumes the loop', () => {
    const snow = createSnow(canvas);
    snow.start();
    snow.pause();
    expect(browser.pendingFrames()).toBe(0);
    snow.resume();
    expect(browser.pendingFrames()).toBe(1);
  });

  it('keeps flakes falling after stop, then idles once they are gone', () => {
    const snow = createSnow(canvas, { prefill: true, groundTime: [0, 0], speed: 1000 });
    snow.start();
    browser.frame();
    snow.stop();
    expect(browser.pendingFrames()).toBe(1);
    for (let i = 0; i < 200 && browser.pendingFrames() > 0; i++) browser.frame(100);
    expect(browser.pendingFrames()).toBe(0);
  });

  it('idles while offscreen', () => {
    const snow = createSnow(canvas);
    snow.start();
    browser.setVisible(false);
    expect(browser.pendingFrames()).toBe(0);
    browser.setVisible(true);
    expect(browser.pendingFrames()).toBe(1);
  });

  it('repaints on resize while paused', () => {
    const snow = createSnow(canvas, { prefill: true });
    snow.pause();
    vi.mocked(browser.context.clearRect as () => void).mockClear();
    browser.resize();
    expect(browser.context.clearRect).toHaveBeenCalled();
    expect(browser.pendingFrames()).toBe(0);
  });

  it('follows the pointer only with followPointer, and ignores touch', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const snow = createSnow(canvas);
    expect(add).not.toHaveBeenCalledWith('pointermove', expect.anything(), expect.anything());
    snow.update({ followPointer: true });
    expect(add).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true });
  });

  it('drops pointer wind under reduced motion', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    createSnow(canvas, { followPointer: true });
    remove.mockClear();
    browser.setReducedMotion(true);
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
  });

  it('releases everything on destroy', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const snow = createSnow(canvas, { followPointer: true });
    snow.start();
    snow.destroy();
    expect(browser.pendingFrames()).toBe(0);
    expect(browser.observers.resize.every(({ disconnected }) => disconnected)).toBe(true);
    expect(browser.observers.intersection.every(({ disconnected }) => disconnected)).toBe(true);
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
    snow.start();
    expect(browser.pendingFrames()).toBe(0);
  });
});
