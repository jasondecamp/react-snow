# <img src="demo/public/favicon.svg" alt="" width="28" height="28"> react-snow

[![CI](https://github.com/jasondecamp/react-snow/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jasondecamp/react-snow/actions/workflows/ci.yml)

Falling snow on a `<canvas>`: a framework-free snow SDK, plus a React hook (`useSnow`) and component (`<Snow>`).

Try every option in the [playground](https://jasondecamp.github.io/react-snow/).

- One canvas per storm, drawn from pre-rendered sprites. Hundreds of flakes cost about what a handful of DOM nodes would.
- Delta-time physics: the same speed at 60Hz and 120Hz.
- Flakes fill the sky from the top, sway, land along the bottom edge, and melt.
- Soft dots by default, or any SVG or PNG shape, optionally spinning.
- The loop idles whenever nothing can change: paused, offscreen, hidden tab, or no flakes left.

## Install

Releases are git tags with the built files, installed straight from GitHub:

```bash
pnpm add github:jasondecamp/react-snow#semver:^0.2.0
# or pin one release: github:jasondecamp/react-snow#v0.2.0
```

`#main` and commit installs don't work: only release tags contain `dist/`. React (>= 19) is an optional peer dependency, needed only for the React entry point.

## React

### `<Snow>`: declarative

```jsx
import { Snow } from 'react-snow';

<div className='hero'>  {/* position: relative */}
  <Snow falling={snowing} density={0.8} color='#00000066' />
  …
</div>
```

`<Snow>` renders a canvas that absolutely fills its nearest positioned ancestor (`position: absolute; inset: 0; pointer-events: none`). Give the parent `position: relative` and stack it as you like; `className` and `style` override the defaults.

| Prop | Default | |
| --- | --- | --- |
| `falling` | `true` | Whether new flakes keep spawning. Turning it off lets the flakes in play land and melt. |
| `paused` | `false` | Freeze every flake in place. |
| `className`, `style` | | Applied to the canvas. |
| …every [option](#options) | | Live: change a prop and only that option updates. |

Unmount it to remove the snow; change its `key` to reset it to an empty sky.

### `useSnow`: imperative

```jsx
import { useEffect } from 'react';
import { useSnow } from 'react-snow';

const Hero = () => {
  const { ref, start, stop, pause, resume, clear } = useSnow({ density: 0.8 });
  useEffect(() => start(), [start]);
  return <canvas ref={ref} className='snow' aria-hidden />;
};
```

The hook starts idle: call `start()`. The control functions are stable across renders. Options are live: re-render with new values and only the changed ones are applied. The instance lives as long as the canvas is mounted.

Destructure `ref` rather than writing `<canvas ref={snow.ref}>`: the React Compiler lint rules treat reading a `.ref` property during render as a ref access.

## Core (no framework)

```js
import { createSnow } from 'react-snow/core';

const snow = createSnow(document.querySelector('canvas'), { density: 0.8 });
snow.start();
snow.update({ wind: -20 });
```

`createSnow(canvas, options)` sizes itself to the canvas's CSS box (position the canvas with CSS) and never adds anything to the DOM.

| Method | |
| --- | --- |
| `start()` / `stop()` | Spawning only. `stop()` lets flakes in the air keep falling, land, and melt; `start()` adds new snow to whatever is still there. Neither clears nor prefills. |
| `pause()` / `resume()` | Freeze and unfreeze all motion, independently of spawning. |
| `clear()` | Remove every flake now. |
| `update(options)` | Merge new options; `undefined` restores a default. |
| `destroy()` | Stop the loop and release every observer and listener. |

## Options

| Option | Default | |
| --- | --- | --- |
| `density` | `0.5` | Average falling flakes per 100×100 CSS px. Grounded flakes don't count. |
| `maxFlakes` | `1000` | Hard cap on falling flakes. |
| `speed` | `60` | Base fall rate, px/s. Bigger flakes fall faster, smaller ones slower. |
| `speedVariation` | `0.5` | 0–1. Each flake falls at `speed × (1 ± speedVariation)`. |
| `wind` | `0` | Base drift, px/s; negative is left. |
| `windVariation` | `0.5` | 0–1. Each flake drifts at `wind ± windVariation × speed × 0.5` and sways side to side in proportion. `0` falls straight. |
| `size` | `[2, 6]` | Flake diameter range, px. |
| `opacity` | `[0.4, 1]` | Linked to size, so small flakes read as far away. |
| `color` | `'#fff'` | Any CSS color, or a `[near, far]` pair: the nearest flakes get `near`, the farthest `far`, and depths between get a blend. Alpha multiplies with `opacity`. |
| `flake` | `'dot'` | The flake look: `'dot'`, `{ svg: markup }`, or `{ src: pngUrl }`. See [Flakes](#flakes). |
| `rotate` | `false` | Each flake starts at a random angle and slowly spins while it falls. |
| `stick` | `true` | Flakes rest along the bottom edge before melting. |
| `groundTime` | `[4, 10]` | Seconds a landed flake rests. Past about 2 resting flakes per 100px of width, the oldest melt early. |
| `melt` | `true` | Flakes shrink and fade as they melt. Otherwise they fade quickly. |
| `twinkle` | `false` | Falling flakes occasionally flicker. |
| `followPointer` | `false` | The pointer's horizontal position over the canvas bends the wind. Touch is ignored. |
| `pointerStrength` | `1` | The pointer's push at the canvas edges, as a multiple of `speed`. |
| `respectReducedMotion` | `true` | Under `prefers-reduced-motion: reduce`, cap fall speed at 20 px/s and wind at 10 px/s, and turn off twinkle, pointer wind, and rotation. |
| `prefill` | `false` | Start with a full sky. Read once, at creation. |

### Flakes

```jsx
<Snow flake={{ svg: '<svg viewBox="0 0 10 10"><path fill="currentColor" d="…"/></svg>' }} size={[8, 16]} rotate />
<Snow flake={{ src: '/images/flake.png' }} />
```

- `{ svg }` takes SVG markup. `currentColor` in it follows `color`, including a `[near, far]` depth blend; other colors are drawn as written. A missing `xmlns` is added.
- `{ src }` takes a PNG URL (a `.png` path or a `data:image/png` URL). Only its alpha is used, as a silhouette that `color` fills, with the same depth blend. Draw the shape in any solid color on a transparent background.
- Both are fitted inside a `size`-wide square, keeping their aspect ratio, and rasterized once per size rather than every frame.
- Flakes stay invisible until a new source loads. If it fails to load, or a `src` isn't a PNG, the default dot is drawn instead, with a console warning.

### Reduced motion

The library never refuses to snow: whether to show snow at all is the app's decision, for example:

```jsx
{!prefersReducedMotion && <Snow />}
```

Left on, `respectReducedMotion` slows whatever does render.

## Development

```bash
pnpm install    # Node 24, pnpm 12
pnpm dev        # playground with a control for every option, at http://localhost:5317
pnpm lint
pnpm typecheck
pnpm test
pnpm build      # tsc -> dist/
pnpm build:demo # playground -> demo/dist/
```

Releases: bump `version` in a pull request. Merging it to `main` builds, tags `v<version>`, creates a GitHub Release, and deploys the playground to GitHub Pages. See [`docs/PLAN.md`](docs/PLAN.md) for the design.

## Credits

Inspired by Scott Schiller's [DHTML Snowstorm](https://github.com/scottschiller/Snowstorm) ("making it snow on the internets since 2003"), by way of [jasondecamp/Snowstorm](https://github.com/jasondecamp/Snowstorm). react-snow is a ground-up rewrite and contains none of its code.

## License

[MIT](LICENSE)
