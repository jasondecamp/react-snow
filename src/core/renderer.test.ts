import { settle, stubBrowser } from '../test/browserStubs.js';
import type { BrowserStubs } from '../test/browserStubs.js';
import { createRenderer } from './renderer.js';
import type { FlakeVisitor } from './simulation.js';

let browser: BrowserStubs;

beforeEach(() => {
  browser = stubBrowser();
});

afterEach(() => {
  browser.restore();
});

/** Draw one flake per depth and return the sprite each was drawn with. */
const spritesByDepth = (color: string | readonly [string, string], depths: number[]) => {
  const renderer = createRenderer(document.createElement('canvas'));
  renderer.resize(100, 100, 1);
  renderer.setLook(color, 6);
  renderer.draw({
    forEachFlake: (visitor: FlakeVisitor) => depths.forEach((depth) => visitor(50, 50, 4, 1, depth, 0)),
  });
  const drawImage = browser.context.drawImage as ReturnType<typeof vi.fn>;
  return drawImage.mock.calls.map((call) => call[0] as unknown);
};

describe('createRenderer', () => {
  it('draws every depth from one sprite for a single color', () => {
    const sprites = spritesByDepth('#fff', [1, 0.5, 0]);
    expect(new Set(sprites).size).toBe(1);
  });

  it('draws a color range from 8 sprites, nearest to farthest', () => {
    const depths = Array.from({ length: 8 }, (_, step) => 1 - (step + 0.5) / 8);
    const sprites = spritesByDepth(['#fff', '#00f'], [...depths, 1, 0]);
    expect(new Set(sprites).size).toBe(8);
    expect(sprites[8]).toBe(sprites[0]);
    expect(sprites[9]).toBe(sprites[7]);
  });

  it('treats a range of matching colors as a single color', () => {
    const sprites = spritesByDepth(['#fff', '#fff'], [1, 0]);
    expect(new Set(sprites).size).toBe(1);
  });

  it('rotates a flake about its center', () => {
    const renderer = createRenderer(document.createElement('canvas'));
    renderer.resize(100, 100, 2);
    renderer.setLook('#fff', 6);
    renderer.draw({ forEachFlake: (visitor: FlakeVisitor) => visitor(10, 20, 4, 1, 1, Math.PI / 2) });
    const setTransform = browser.context.setTransform as ReturnType<typeof vi.fn>;
    const [a = 0, b = 0, c = 0, d = 0, e, f] = setTransform.mock.calls[1] as number[];
    expect([a, b, c, d].map((value) => Math.round(value))).toEqual([0, 2, -2, 0]);
    expect([e, f]).toEqual([20, 40]);
    expect(browser.context.drawImage).toHaveBeenLastCalledWith(expect.anything(), -2, -2, 4, 4);
  });
});

describe('createRenderer with SVG and image flakes', () => {
  const svg = '<svg viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h10v10z"/></svg>';

  const setup = () => {
    const onLoad = vi.fn();
    const renderer = createRenderer(document.createElement('canvas'), onLoad);
    renderer.resize(100, 100, 1);
    const drawImage = browser.context.drawImage as ReturnType<typeof vi.fn>;
    /** Draw one flake at each depth and return the sprites used. */
    const drawn = (depths = [1, 0]) => {
      drawImage.mockClear();
      renderer.draw({ forEachFlake: (visitor: FlakeVisitor) => depths.forEach((depth) => visitor(50, 50, 4, 1, depth, 0)) });
      return drawImage.mock.calls.map((call) => call[0] as unknown);
    };
    return { renderer, onLoad, drawn };
  };

  it('draws nothing until an SVG loads, then one sprite per color step', async () => {
    const { renderer, onLoad, drawn } = setup();
    renderer.setLook(['#fff', '#00f'], 6, { svg });
    expect(browser.images).toHaveLength(8);
    expect(drawn()).toHaveLength(0);
    browser.images.forEach((image) => image.load());
    await settle();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(new Set(drawn([1, 0])).size).toBe(2);
  });

  it('keeps a loaded SVG on screen while a new color loads', async () => {
    const { renderer, drawn } = setup();
    renderer.setLook('#fff', 6, { svg });
    browser.images.forEach((image) => image.load());
    await settle();
    renderer.setLook('#f00', 6, { svg });
    expect(browser.images).toHaveLength(2);
    expect(drawn()).toHaveLength(2);
  });

  it('tints a PNG with each color step from one load', async () => {
    const { renderer, drawn } = setup();
    renderer.setLook(['#fff', '#00f'], 6, { src: 'flake.png?v=2' });
    expect(browser.images.map(({ url }) => url)).toEqual(['flake.png?v=2']);
    browser.images[0]?.load();
    await settle();
    expect(new Set(drawn([1, 0])).size).toBe(2);
    expect(browser.context.globalCompositeOperation).toBe('source-in');
    renderer.setLook('#f00', 6, { src: 'flake.png?v=2' });
    expect(browser.images).toHaveLength(1);
    expect(new Set(drawn([1, 0])).size).toBe(1);
  });

  it('falls back to the dot for an image that is not a PNG', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { renderer, drawn } = setup();
    renderer.setLook('#fff', 6, { src: 'flake.jpg' });
    await settle();
    expect(browser.images).toHaveLength(0);
    expect(drawn()).toHaveLength(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores a load that a newer flake replaced', async () => {
    const { renderer, onLoad, drawn } = setup();
    renderer.setLook('#fff', 6, { src: 'old.png' });
    renderer.setLook('#fff', 6, { src: 'new.png' });
    browser.images[0]?.load();
    await settle();
    expect(onLoad).not.toHaveBeenCalled();
    expect(drawn()).toHaveLength(0);
  });

  it('falls back to the dot when a flake fails to load, warning once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { renderer, onLoad, drawn } = setup();
    renderer.setLook('#fff', 6, { svg: '<p>not svg</p>' });
    await settle();
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(drawn()).toHaveLength(2);
    renderer.setLook('#f00', 6, { svg: '<p>not svg</p>' });
    await settle();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
