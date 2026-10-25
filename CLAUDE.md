# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

react-snow is Jason DeCamp's falling-snow library: a framework-free TypeScript core that animates snow on a `<canvas>`, plus a React hook (`useSnow`) and component (`<Snow>`). It is a ground-up rewrite of [jasondecamp/Snowstorm](https://github.com/jasondecamp/Snowstorm) (a fork of Scott Schiller's DHTML Snowstorm); no code is carried over. Consumers install it from GitHub release tags, not npm. The full design, every settled decision, and phase status live in [`docs/PLAN.md`](docs/PLAN.md); read it before starting work, and update it when a decision changes.

Conventions are ported from Jason's fourfightingfoxes and moved-react codebases (both plain JS) and adapted to TypeScript, so style and organization stay consistent across projects.

## Commands

The toolchain lands with 0.1.0.

```bash
pnpm install          # Node 24, pnpm 12
pnpm dev              # demo playground (Vite) at http://localhost:5317, imports from src/
pnpm build            # tsc -> dist/ (ESM .js + .d.ts)
pnpm lint             # ESLint 10 flat config
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
```

## Architecture

### Layers

- **`src/core/`** has no framework dependency. It contains the simulation, the canvas renderer, sprites, and `createSnow`, exported as `react-snow/core`.
  - The **simulation** is pure: flakes, physics, and ground state, advanced by `step(dt)`. It never touches `window`, `document`, or the canvas, and takes its random source and clock as inputs so tests are deterministic.
  - The **renderer** draws simulation state to a 2D canvas from a pre-rendered sprite (rendered once at twice the largest flake size and scaled down with `drawImage`). New flake looks (SVG, images) are new sprite sources, never per-frame drawing code.
  - **`createSnow(canvas, options)`** wires them together with `requestAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, `matchMedia('(prefers-reduced-motion: reduce)')`, and pointer listeners. It never inserts DOM. Every resource it acquires is released by `destroy()`.
- **`src/react/`** contains `useSnow` and `Snow`, exported as `react-snow`. It may import from core, but core never imports from React.
  - `useSnow(options)` is the **imperative** layer. It returns `{ ref, start, stop, pause, resume, clear }` with stable identities and diffs the options key by key into `update()`. It is idle until `start()`.
  - `<Snow>` is the **declarative** layer. It destructures `falling`, `paused`, `className`, and `style`, passes the rest to `useSnow`, and syncs the two state props to the control functions in effects. It has no `ref` and no imperative handle; consumers who need imperative control use the hook.
- **Control semantics are part of the API:** `start`/`stop` toggle spawning only (never clear or prefill); `pause`/`resume` freeze all motion, independent of spawning. Don't blur them.

### Distribution

- Source is TypeScript, compiled by plain `tsc` (no bundler) to per-file ESM in `dist/`. Relative imports in `src/` use `.js` extensions so the output is valid Node ESM. TypeScript is pinned to 6.0 because typescript-eslint doesn't support 7 yet; revisit when it does. `dist/` is git-ignored on `main`.
- `package.json` `exports` map `.` to the React entry and `./core` to the core entry. `react` (>= 19) is an optional peer dependency. `sideEffects: false`.
- **Releases:** bump `version` in a PR. When it merges, `.github/workflows/release.yml` sees a version with no matching tag, then lints, tests, builds, commits `dist/` in a release-only commit, tags `v<version>`, and creates a GitHub Release. Merges without a bump don't release.
- Consumers install `github:jasondecamp/react-snow#v<version>` or `#semver:^<range>`. `#main` installs don't work, because `main` has no `dist/`.

### Directory structure

```
src/
  core/                       # simulation, renderer, sprites, createSnow, options, types, index.ts
  react/                      # useSnow.ts, Snow.tsx, index.ts
  test/                       # test helpers (seeded random, browser stubs, fake createSnow); not built
demo/                         # Vite playground, not published; imports 'react-snow' aliased to src/
  components/<Name>/          # <Name>.tsx + <Name>.module.scss
docs/PLAN.md
.github/workflows/            # ci.yml, release.yml
```

## Code style

- TypeScript `strict`. No `any`; use `unknown` and narrow. Use `import type` for type-only imports. Prefer `type` aliases to `interface`, and string-literal unions to `enum`. Avoid non-null assertions (`!`); handle the null.
- Export the public option, instance, and prop types from each entry point. They are the consumer's documentation: every option gets a TSDoc comment stating its unit, range, and default.
- Single quotes. Arrow functions for components and callbacks. Destructure props.
- **Named exports only** in `src/` and `demo/`. Config files are exempt.
- One component per file. Name variables in camelCase.
- Semantic HTML. Always provide `alt` text on images and `aria-label` on interactive elements without visible text. The snow canvas is always `aria-hidden`.
- Plain string `className`s use quotes, never braces: `className='intro'`, not `className={'intro'}`. Use braces only for computed values. Prefer `classNames` over template-literal class interpolation.
- Use `!= null` instead of `!!` for boolean coercion.
- Event handlers: `onClick={() => fn()}` and `onClick={fn}` are not equivalent (React passes the event as the first argument). Check the callee's signature before "simplifying" a wrapper; when in doubt, leave it.
- UI labels are sentence case, never Title Case Per Word.
- Keep edits scoped to the task. No unrelated refactors or "cleanups" in the same change.
- Generated or scripted code reads like hand-written code: no needless wrappers, and indentation exactly one level per nesting.

## Component design: composition over configuration

`<Snow>` is a deliberate leaf: the consumer owns placement by positioning its parent. Any shared component added later (in the demo, or a future library component) follows the house pattern: one composite component with attached subcomponents, composed as **children** and never configured through prop arrays or slot props.

```jsx
<Controls>
  <Controls.Slider name='density' />
  <Controls.Toggle name='stick' />
</Controls>
```

- Structural parts become subcomponents attached to the root.
- Shared state flows through context, with a safe default so subcomponents can render standalone.
- The consumer owns the arrangement; data-driven children are mapped by the consumer, not passed as config.

## Styling

- **The library ships no CSS.** `<Snow>` applies its overlay defaults (`position: absolute; inset: 0; pointer-events: none`) as inline `style`, merged under the consumer's `style`. That is the one sanctioned inline style. Never put CSS variables in inline styles.
- **The demo** uses Sass with CSS modules, as in fourfightingfoxes:
  - Every component imports **only** its co-named `<Name>.module.scss`. Shared styles are explicit Sass partials that modules `@use`/`@forward`.
  - camelCase class names in modules (`.pageTitle`).
  - Use tokens from a variables-only `_tokens.scss`; avoid one-off values.
  - Space and position siblings with flex/grid `gap`, not child margins, wherever a flex or grid container fits.
  - New transitions default to `0.2s`.
  - `border-radius: 50%` only on square elements.
  - Do not invent classes that don't exist.

## Performance rules

- No allocation in the per-frame path: reuse flake objects (pool and recycle) and sprites.
- All motion is delta-time based (px per second), never per frame. Clamp large `dt` (tab returning from the background) so flakes don't teleport.
- The loop idles (no `requestAnimationFrame` scheduled) whenever nothing can change: paused, offscreen, or not spawning with no flakes left.
- The canvas backing store is sized to `devicePixelRatio`; sprites are rendered at that ratio.

## Testing and validation

- **Vitest** (`pnpm test`): co-locate tests with the code they cover (`name.test.ts` next to `name.ts`).
  - Simulation tests run in the `node` environment (`// @vitest-environment node`) with an injected random source and clock.
  - Renderer, hook, and component tests run in jsdom with a stubbed 2D context (jsdom has no canvas). Use Testing Library and `@testing-library/user-event` for interaction.
  - Cover StrictMode (mount, unmount, mount): no leaked loops, observers, or listeners.
  - The React Compiler lint rules (eslint-plugin-react-hooks 7) treat reading a `.ref` property during render as a ref access: destructure `ref` from `useSnow` before using it in JSX.
- Validate before shipping: run lint, typecheck, tests, and the build before calling anything done. Visual behavior is checked by Jason in the demo playground on his own `pnpm dev`; don't start a second dev server on the same port.
- Skip re-running the test suite for style-only (SCSS) demo changes.

## Git and releases

- **Never commit or push without Jason's explicit approval.** Pushing a branch, opening a PR, and merging each need his go-ahead too.
- Commit email for this repo is `jason@fourfightingfoxes.com` (repo-local git config).
- Explain and confirm before any destructive git operation.
- Work happens on feature branches off an up-to-date `main` (`git switch -c <descriptive-branch>`) and lands through GitHub pull requests. CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, and build on every PR.
- A PR that bumps `version` releases on merge, so treat merging a version bump as a release that needs Jason's explicit go-ahead.
- Approval like "looks good, ship it" means commit and push the feature branch for its PR, not merge.
