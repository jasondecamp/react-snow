// @vitest-environment node
import { blendColors } from './colors.js';

describe('blendColors', () => {
  it('runs from near to far inclusive in even steps', () => {
    expect(blendColors([255, 255, 255, 1], [0, 0, 255, 0.5], 3)).toEqual([
      'rgba(255, 255, 255, 1)',
      'rgba(128, 128, 255, 0.75)',
      'rgba(0, 0, 255, 0.5)',
    ]);
  });

  it('returns the near color alone for a single step', () => {
    expect(blendColors([10, 20, 30, 1], [0, 0, 0, 1], 1)).toEqual(['rgba(10, 20, 30, 1)']);
  });
});
