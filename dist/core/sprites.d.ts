export type Sprite = HTMLCanvasElement;
/**
 * A round dot with a soft edge. The color fills a circle, then a radial alpha
 * mask (destination-in) feathers its edge, which avoids the dark fringe a
 * color-to-transparent gradient can leave.
 */
export declare const createDotSprite: (doc: Document, color: string, pixelSize: number) => Sprite | null;
/**
 * An image fitted inside the square sprite, centered, keeping its aspect
 * ratio. With a `tint`, only the image's alpha is kept: the color fills it
 * (source-in), so the image works as a silhouette.
 */
export declare const createImageSprite: (doc: Document, image: HTMLImageElement, pixelSize: number, tint?: string) => Sprite | null;
/** Whether a URL names a PNG: a `.png` path (before any query or hash) or a PNG data URL. */
export declare const isPngUrl: (url: string) => boolean;
/**
 * SVG markup as a data URL with `currentColor` resolved to `color`, or null if
 * it isn't SVG. Markup without an `xmlns` (as inline SVG in HTML often is) gets
 * one. A root without `width` and `height` takes them from its `viewBox`, since
 * an SVG image needs an intrinsic size to draw in every browser.
 */
export declare const svgDataUrl: (markup: string, color: string) => string | null;
/** Load an image, resolving once it can be drawn. */
export declare const loadImage: (doc: Document, url: string) => Promise<HTMLImageElement>;
//# sourceMappingURL=sprites.d.ts.map