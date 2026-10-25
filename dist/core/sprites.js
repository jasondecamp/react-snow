// Flake sprites: each look is rendered once to a small offscreen canvas and
// drawn scaled with drawImage every frame. New looks (SVG, images) are new
// sprite factories here, never per-frame drawing code.
/**
 * A round dot with a soft edge. The color fills a circle, then a radial alpha
 * mask (destination-in) feathers its edge, which avoids the dark fringe a
 * color-to-transparent gradient can leave.
 */
export const createDotSprite = (doc, color, pixelSize) => {
    const sprite = doc.createElement('canvas');
    sprite.width = pixelSize;
    sprite.height = pixelSize;
    const context = sprite.getContext('2d');
    if (context == null)
        return null;
    const radius = pixelSize / 2;
    context.fillStyle = color;
    context.beginPath();
    context.arc(radius, radius, radius, 0, Math.PI * 2);
    context.fill();
    const mask = context.createRadialGradient(radius, radius, 0, radius, radius, radius);
    mask.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mask.addColorStop(0.55, 'rgba(255, 255, 255, 1)');
    mask.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.globalCompositeOperation = 'destination-in';
    context.fillStyle = mask;
    context.fillRect(0, 0, pixelSize, pixelSize);
    return sprite;
};
/**
 * An image fitted inside the square sprite, centered, keeping its aspect
 * ratio. With a `tint`, only the image's alpha is kept: the color fills it
 * (source-in), so the image works as a silhouette.
 */
export const createImageSprite = (doc, image, pixelSize, tint) => {
    const sprite = doc.createElement('canvas');
    sprite.width = pixelSize;
    sprite.height = pixelSize;
    const context = sprite.getContext('2d');
    if (context == null)
        return null;
    // An SVG without an intrinsic size can report 0; treat it as square.
    const naturalWidth = image.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || 1;
    const scale = pixelSize / Math.max(naturalWidth, naturalHeight);
    const width = naturalWidth * scale;
    const height = naturalHeight * scale;
    context.drawImage(image, (pixelSize - width) / 2, (pixelSize - height) / 2, width, height);
    if (tint != null) {
        context.globalCompositeOperation = 'source-in';
        context.fillStyle = tint;
        context.fillRect(0, 0, pixelSize, pixelSize);
    }
    return sprite;
};
/** Whether a URL names a PNG: a `.png` path (before any query or hash) or a PNG data URL. */
export const isPngUrl = (url) => /\.png(?:[?#]|$)/i.test(url) || /^data:image\/png[;,]/i.test(url);
const svgNamespace = 'http://www.w3.org/2000/svg';
const parseSvg = (markup) => {
    const root = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
    const valid = root instanceof SVGSVGElement && root.getElementsByTagName('parsererror').length === 0;
    return valid ? root : null;
};
/**
 * SVG markup as a data URL with `currentColor` resolved to `color`, or null if
 * it isn't SVG. Markup without an `xmlns` (as inline SVG in HTML often is) gets
 * one. A root without `width` and `height` takes them from its `viewBox`, since
 * an SVG image needs an intrinsic size to draw in every browser.
 */
export const svgDataUrl = (markup, color) => {
    if (typeof DOMParser === 'undefined')
        return null;
    const root = parseSvg(markup) ?? parseSvg(markup.replace(/<svg\b/, `<svg xmlns="${svgNamespace}"`));
    if (root == null)
        return null;
    root.style.setProperty('color', color);
    const [, , viewBoxWidth, viewBoxHeight] = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number);
    if (viewBoxWidth != null && viewBoxHeight != null && viewBoxWidth > 0 && viewBoxHeight > 0) {
        if (!root.hasAttribute('width'))
            root.setAttribute('width', String(viewBoxWidth));
        if (!root.hasAttribute('height'))
            root.setAttribute('height', String(viewBoxHeight));
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(root))}`;
};
/** Load an image, resolving once it can be drawn. */
export const loadImage = (doc, url) => (new Promise((resolve, reject) => {
    const image = doc.createElement('img');
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Couldn't load ${url.slice(0, 100)}`));
    image.src = url;
}));
//# sourceMappingURL=sprites.js.map