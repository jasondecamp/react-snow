import { stubBrowser } from '../test/browserStubs.js';
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
    forEachFlake: (visitor: FlakeVisitor) => depths.forEach((depth) => visitor(50, 50, 4, 1, depth)),
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
});
