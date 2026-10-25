import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The playground imports the library by its package name, like a consumer
// would, but aliased to src/ so edits show up live without a build.
export default defineConfig({
  plugins: [react()],
  // A fixed port of its own, so it never collides with other local Vite apps.
  server: { port: 5317, strictPort: true },
  resolve: {
    alias: [
      { find: /^react-snow\/core$/, replacement: fileURLToPath(new URL('../src/core/index.ts', import.meta.url)) },
      { find: /^react-snow$/, replacement: fileURLToPath(new URL('../src/react/index.ts', import.meta.url)) },
    ],
  },
});
