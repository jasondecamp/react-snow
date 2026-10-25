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
//# sourceMappingURL=sprites.js.map