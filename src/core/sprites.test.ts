import { isPngUrl, svgDataUrl } from './sprites.js';

const decode = (url: string | null) => {
  expect(url).not.toBeNull();
  const markup = decodeURIComponent((url ?? '').replace('data:image/svg+xml;charset=utf-8,', ''));
  return new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
};

describe('svgDataUrl', () => {
  it('resolves currentColor to the given color', () => {
    const root = decode(svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><path fill="currentColor"/></svg>', 'red'));
    expect(root.getAttribute('style')).toContain('color: red');
  });

  it('adds a missing xmlns', () => {
    const root = decode(svgDataUrl('<svg viewBox="0 0 10 10"><path/></svg>', '#fff'));
    expect(root.namespaceURI).toBe('http://www.w3.org/2000/svg');
  });

  it('sizes a root without width and height from its viewBox', () => {
    const root = decode(svgDataUrl('<svg viewBox="0 0 24 12"/>', '#fff'));
    expect(root.getAttribute('width')).toBe('24');
    expect(root.getAttribute('height')).toBe('12');
  });

  it('keeps an explicit width and height', () => {
    const root = decode(svgDataUrl('<svg width="5" height="5" viewBox="0 0 24 12"/>', '#fff'));
    expect(root.getAttribute('width')).toBe('5');
  });

  it('rejects markup that is not SVG', () => {
    expect(svgDataUrl('<div></div>', '#fff')).toBeNull();
    expect(svgDataUrl('<svg><path></svg>', '#fff')).toBeNull();
  });
});

describe('isPngUrl', () => {
  it('accepts PNG paths and data URLs', () => {
    expect(isPngUrl('/images/flake.png')).toBe(true);
    expect(isPngUrl('https://example.com/Flake.PNG?v=2#top')).toBe(true);
    expect(isPngUrl('data:image/png;base64,iVBOR')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isPngUrl('flake.jpg')).toBe(false);
    expect(isPngUrl('flake.svg')).toBe(false);
    expect(isPngUrl('flake.png.svg')).toBe(false);
    expect(isPngUrl('data:image/svg+xml,<svg/>')).toBe(false);
  });
});
