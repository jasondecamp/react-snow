# react-snow plan

A ground-up rewrite of [jasondecamp/Snowstorm](https://github.com/jasondecamp/Snowstorm) (Jason's fork of Scott Schiller's 2003–2013 DHTML Snowstorm) as a platform-agnostic snow SDK with a React hook and component, installable from GitHub. Decisions below were settled in a grill-me session on 2026-10-25.

## Goals

- A pure, framework-free core that creates, customizes, and controls a snow animation on a canvas.
- A React layer, `useSnow` (imperative) and `<Snow>` (declarative), that embeds snow inside any component.
- Installable as a dependency straight from GitHub (`github:jasondecamp/react-snow#semver:^0.1.0`).
- Replace the `window.snowStorm` global, script injection, and polling in `moved-react`'s admin `Snow.jsx`.
- Follow the conventions of fourfightingfoxes and moved-react, adapted to TypeScript.

## What the original did, and what changes

The original is a global singleton configured by mutating properties, auto-started on `window.load`, rendering one absolutely positioned `<div>` (`&bull;`) per flake and moving each with `style` writes every frame. About half of it is IE6 and vendor-prefix scaffolding. It can't run twice, never tears down, and its per-frame movement ties fall speed to the display refresh rate.

The rewrite keeps the concept and the behaviors worth keeping (wind, pointer-driven wind, sticking, melting, twinkling, rendering inside a target area) and rebuilds everything else.

## Decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Rendering | One `<canvas>` per instance, drawn in a `requestAnimationFrame` loop with delta-time physics (same speed at 60Hz and 120Hz). The simulation is a pure module with no DOM access; the canvas renderer is a thin layer on top. Flakes are pre-rendered sprites, so SVG/image flakes later are just another sprite source. |
| 2 | Language and distribution | TypeScript (`strict`), compiled by plain `tsc` (no bundler; TypeScript is pinned to 6.0 until typescript-eslint supports 7) to per-file ESM `.js` + `.d.ts` in `dist/`, with `jsx: react-jsx`. `dist/` is git-ignored on `main` and only exists on release tags, so consumers install a tag (`#v0.1.0` or `#semver:^0.1.0`); `#main` and SHA installs are not supported. |
| 3 | Entry points | `react-snow` (React: `useSnow`, `Snow`) and `react-snow/core` (`createSnow`). `react` (>= 19) is an optional peer dependency, so core-only consumers don't need it. `sideEffects: false`. |
| 4 | Naming | `createSnow`, `useSnow`, `<Snow>`. |
| 5 | Carried-over options | `snowColor` → `color`; `snowCharacter` → `flake`; `vMaxX`/`vMaxY` → `wind`/`speed` (px per second); `followMouse` → `followPointer` (default off); `snowStick` → `stick`; `useMeltEffect` → `melt`; `useTwinkleEffect` → `twinkle`; six fixed flake types → `size` range; `flakesMax`/`flakesMaxActive` → `density` + `maxFlakes`. |
| 6 | Dropped options | `autoStart`, `targetElement`, `flakeBottom`, left/right offsets, `useGPU`, `usePositionFixed`, `usePixelPosition`, `zIndex`, `className`, `flakeWidth`/`flakeHeight`, `accessibility` (the canvas is always `aria-hidden`), `animationInterval`, `excludeMobile`, `freezeOnBlur`. |
| 7 | Speed and wind | Independent variation for each. Fall speed per flake: `speed × (1 ± speedVariation)` × a size factor, with a floor. Drift per flake: `wind ± windVariation × speed × 0.5` (spread is relative to fall speed so it works when `wind` is 0). Each flake also sways on its own slow sine wave, with amplitude scaled by `windVariation`; `windVariation: 0` falls in straight lines. Gusts (storm-wide wind wandering over time) come later. |
| 8 | Density | Average falling flakes per 100×100 CSS-pixel area, default 0.5 (matches the original's 64 active flakes on a ~1440×900 window). Recomputed on resize. Hard `maxFlakes` cap (default 1000). Grounded flakes don't count toward density. |
| 9 | Reduced motion | The parent decides whether to render snow at all; the library never refuses. When `prefers-reduced-motion: reduce` matches, the library caps fall and wind speed low and disables twinkle and pointer wind. `respectReducedMotion: false` turns the cap off. |
| 10 | Core API | `createSnow(canvas, options)` takes a canvas (not a container), sizes itself to the canvas's CSS box with a `ResizeObserver`, and never inserts DOM. It is created idle. Instance methods: `start`/`stop` (spawning only: never clear or prefill; flakes in flight keep falling and grounded flakes keep melting), `pause`/`resume` (freeze/unfreeze everything in motion, independent of spawning), `clear` (remove all flakes now), `update(options)` (live merge), `destroy` (stop loop, disconnect observers and listeners, drop flakes). The loop idles whenever nothing can change. `prefill` is creation-time only (default `false`). |
| 11 | Hook | `useSnow(options)` returns `{ ref, start, stop, pause, resume, clear }`, with stable function identities. Options are the update mechanism: the hook diffs them key by key each render and calls the instance's `update` with what changed. No `update` is exposed. Idle on mount; the consumer calls `start()`. SSR-safe. Unmount destroys the instance. |
| 12 | Component | `<Snow falling paused className style {...options} />`. `falling` (default `true`) and `paused` (default `false`) are component state props, not options: the component destructures them out, passes the rest to `useSnow`, and syncs them to `start`/`stop` and `pause`/`resume` in effects. No `ref`, no imperative handle: imperative control means using the hook. It renders a leaf `<canvas>` that absolutely fills its nearest positioned ancestor (`position: absolute; inset: 0; pointer-events: none`), overridable through `className`/`style`. Declarative equivalents: unmount for remove/destroy, a changed `key` for a reset. |
| 13 | Ground | With `stick`, a landed flake rests a few random pixels above the bottom edge for a random `groundTime` (default `[4, 10]` s), then melts. A ground cap (about 2 per 100px of width) melts the oldest early. `stop()` therefore clears the ground by itself. Lingering snow (`groundTime: Infinity`) only if wanted later. |
| 14 | Melt and twinkle | `melt`: shrink and fade over about 0.75s, plus a rare mid-air melt for depth. Without `melt`, landed flakes fade out quickly. `twinkle` (default off) flickers alpha while falling. |
| 15 | Pointer wind | `followPointer` maps the pointer's horizontal position across the canvas to a wind push (left edge pushes left, center neutral), up to `pointerStrength` × `speed` at the edges. The wind eases toward the target rather than snapping. It listens on `window` (the canvas has `pointer-events: none`), reacts only while the pointer is within the canvas bounds, eases back on leave, and ignores touch. |
| 16 | Flake look | Depth-cued default sprite: a round dot with a soft edge. `size` (default `[2, 6]` px) and `opacity` (default `[0.4, 1]`) are linked, so small flakes are dimmer and slower and large ones brighter and faster. `color` is one CSS color or a `[near, far]` pair, also depth-linked: the nearest flakes get `near`, the farthest `far`, with 8 even blends between (one pre-rendered sprite each, so drawing stays allocation-free). `color` alpha multiplies with `opacity`. Rendered at `devicePixelRatio`. |
| 17 | Visibility | An `IntersectionObserver` idles the loop while the canvas is offscreen. `requestAnimationFrame` already idles hidden tabs. |
| 18 | Repo | `~/work/react-snow`, public GitHub repo `jasondecamp/react-snow`. Node 24, pnpm 12, ESLint 10 flat config with the fourfightingfoxes style rules, Vitest (core in `node` with injected random and clock; renderer, hook, and component in jsdom with a stubbed 2D context). Feature branches and PRs; CI runs lint, test, and build on every PR. MIT license, crediting Scott Schiller's Snowstorm as the inspiration (clean-room rewrite, no code copied). A `CLAUDE.md` adapted from fourfightingfoxes. |
| 19 | Releases | Bumping `package.json`'s version in a PR and merging it to `main` releases: the workflow sees a version with no matching tag, then lints, tests, builds, commits `dist/` on top of the source in a release-only commit, tags `v<version>`, and creates a GitHub Release. Merges without a bump don't release. `0.x` until the defaults are tuned; `1.0.0` ships with the Pages demo. |
| 20 | Demo | A local Vite playground in `demo/` (not in the package) importing from `src/`, with a control for every option and the instance methods. Deployed to GitHub Pages once the defaults are tuned (1.0). |

## Options (defaults to be tuned in the playground)

| Option | Default | Notes |
| --- | --- | --- |
| `density` | `0.5` | Falling flakes per 100×100 CSS px. |
| `maxFlakes` | `1000` | Hard cap on falling flakes. |
| `speed` | ~`60` | Base fall rate, px/s. |
| `speedVariation` | `0.5` | 0–1. |
| `wind` | `0` | Base drift, px/s; negative is left. |
| `windVariation` | `0.5` | 0–1; also scales sway. |
| `size` | `[2, 6]` | Flake diameter range, px. |
| `opacity` | `[0.4, 1]` | Linked to size. |
| `color` | `'#fff'` | Any CSS color, or a `[near, far]` pair blended by depth. |
| `flake` | default dot | Sprite source slot; SVG/image in 0.2. |
| `stick` | `true` | |
| `groundTime` | `[4, 10]` | Seconds a landed flake rests before melting. |
| `melt` | `true` | |
| `twinkle` | `false` | |
| `followPointer` | `false` | |
| `pointerStrength` | `1` | Push at the canvas edges, as a multiple of `speed`. |
| `respectReducedMotion` | `true` | Speed cap when reduced motion is requested. |
| `prefill` | `false` | Creation-time only. |

## Layout

```
src/
  core/        # simulation (pure), canvas renderer, sprites, createSnow, index.ts
  react/       # useSnow.ts, Snow.tsx, index.ts
demo/          # Vite playground (not published)
docs/PLAN.md
.github/workflows/  # ci.yml, release.yml
```

## Phases

1. **0.1.0** (built on branch `initial-sdk`): everything in the decisions above except SVG flakes, gusts, and the Pages deploy. Repo scaffolding, core, React layer, tests, playground, README, `CLAUDE.md`, CI, release workflow.
2. **0.2.0:** SVG and image flakes (`flake: { svg }` / `{ src }`), rasterized per size, optional per-flake rotation.
3. **0.3.0:** gusts (`gusts: true`).
4. **1.0.0:** defaults tuned in the playground; GitHub Pages demo.

## Out of scope

- Migrating `moved-react`'s admin `Snow.jsx`: a follow-up PR there after 0.1.0 is tagged (delete `public/snowstorm.min.js`; the date window and cookie stay in the app).
- `moved-app` (legacy Angular): left alone.
- A fourfightingfoxes portfolio entry and blog post: after 1.0, with the `new-portfolio-entry` skill, possibly embedding `<Snow>` live.
