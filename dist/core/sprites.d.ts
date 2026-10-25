export type Sprite = HTMLCanvasElement;
/**
 * A round dot with a soft edge. The color fills a circle, then a radial alpha
 * mask (destination-in) feathers its edge, which avoids the dark fringe a
 * color-to-transparent gradient can leave.
 */
export declare const createDotSprite: (doc: Document, color: string, pixelSize: number) => Sprite | null;
//# sourceMappingURL=sprites.d.ts.map