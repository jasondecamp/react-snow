import type { FlakeShape } from 'react-snow';

// Sample flakes for the playground. Module constants, so the flake choice can
// compare them by identity.

/** The logo's crystal. `currentColor` follows the `color` option. */
export const crystalFlake: FlakeShape = {
  svg: '<svg viewBox="1.125 1.125 29.75 29.75"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path id="arm" d="M16 12.5 19 7.304V2l-3 2.75L13 2v5.304Z"/><use href="#arm" transform="rotate(60 16 16)"/><use href="#arm" transform="rotate(120 16 16)"/><use href="#arm" transform="rotate(180 16 16)"/><use href="#arm" transform="rotate(240 16 16)"/><use href="#arm" transform="rotate(300 16 16)"/></g></svg>',
};

/** A PNG whose alpha is the shape, tinted by `color`. Relative, so it resolves under the Pages base path too. */
export const imageFlake: FlakeShape = { src: 'flake.png' };
