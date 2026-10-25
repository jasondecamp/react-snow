import { blendColors, parseColor } from './colors.js';
import { createDotSprite } from './sprites.js';
// Sprites render at twice the largest drawn size so every draw downscales.
const spriteSupersample = 2;
// A color range is drawn as this many evenly spaced blends, one sprite each.
const colorSteps = 8;
export const createRenderer = (canvas) => {
    const context = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let nearColor = '';
    let farColor = '';
    let maxSize = 0;
    // Nearest first. One sprite for a single color; empty when nothing can draw.
    let sprites = [];
    const buildSprites = () => {
        sprites = [];
        if (nearColor === '')
            return;
        const doc = canvas.ownerDocument;
        const pixelSize = Math.max(2, Math.ceil(maxSize * pixelRatio * spriteSupersample));
        const colors = nearColor === farColor
            ? [nearColor]
            : blendColors(parseColor(doc, nearColor), parseColor(doc, farColor), colorSteps);
        const built = [];
        for (const color of colors) {
            const sprite = createDotSprite(doc, color, pixelSize);
            if (sprite == null)
                return;
            built.push(sprite);
        }
        sprites = built;
    };
    // Defined once so drawing a frame allocates nothing. Depth 1 (nearest) maps
    // to the first sprite; the depth range splits evenly across the sprites.
    const drawFlake = (x, y, size, alpha, depth) => {
        const step = Math.min(sprites.length - 1, Math.floor((1 - depth) * sprites.length));
        const sprite = sprites[step];
        if (context == null || sprite == null || alpha <= 0 || size <= 0)
            return;
        context.globalAlpha = alpha;
        context.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    };
    return {
        resize: (nextWidth, nextHeight, nextPixelRatio) => {
            const ratioChanged = nextPixelRatio !== pixelRatio;
            width = nextWidth;
            height = nextHeight;
            pixelRatio = nextPixelRatio;
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            if (ratioChanged)
                buildSprites();
        },
        setLook: (color, nextMaxSize) => {
            const [near, far] = typeof color === 'string' ? [color, color] : color;
            if (near === nearColor && far === farColor && nextMaxSize === maxSize)
                return;
            nearColor = near;
            farColor = far;
            maxSize = nextMaxSize;
            buildSprites();
        },
        draw: (simulation) => {
            if (context == null)
                return;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            context.clearRect(0, 0, width, height);
            simulation.forEachFlake(drawFlake);
            context.globalAlpha = 1;
        },
    };
};
//# sourceMappingURL=renderer.js.map