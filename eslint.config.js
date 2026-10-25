// Ported from fourfightingfoxes' eslint.config.js (itself ported from
// moved-react), with typescript-eslint for the TypeScript source.
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Named exports everywhere (CLAUDE.md). Implemented as a syntax restriction, as
// in moved-react, because eslint-plugin-import's no-default-export crashes under
// ESLint 10. Config files are exempt.
const noDefaultExport = {
  selector: 'ExportDefaultDeclaration',
  message: 'Use named exports (CLAUDE.md).',
};

// The core is framework-free (CLAUDE.md): React lives in src/react only.
const coreReactRestriction = {
  patterns: [{
    group: ['react', 'react/*', 'react-dom', 'react-dom/*', '../react/*'],
    message: 'src/core is framework-free; React belongs in src/react.',
  }],
};

// The simulation is pure (CLAUDE.md): no DOM, no ambient randomness.
const simulationGlobals = ['window', 'document', 'navigator', 'requestAnimationFrame', 'performance'].map((name) => ({
  name,
  message: 'The simulation is pure; DOM access belongs in createSnow or the renderer.',
}));

export default defineConfig([
  globalIgnores(['dist/**', 'demo/dist/**', 'coverage/**', 'node_modules/**']),
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'jsx-quotes': ['error', 'prefer-single'],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'demo/**/*.{ts,tsx}'],
    ignores: ['**/*.config.ts', '**/*.d.ts'],
    rules: {
      'no-restricted-syntax': ['error', noDefaultExport],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', coreReactRestriction],
    },
  },
  {
    files: ['src/core/simulation.ts'],
    rules: {
      'no-restricted-globals': ['error', ...simulationGlobals],
    },
  },
  // Config files
  {
    files: ['**/*.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
