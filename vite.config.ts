import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      // The entry point for your plugin logic
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MapLibreLayerCounter',
      // This will output maplibre-layer-counter.js and .mjs
      fileName: 'maplibre-layer-counter',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // Externalize maplibre-gl so it's not bundled in
      external: ['maplibre-gl'],
      output: {
        globals: {
          'maplibre-gl': 'maplibregl',
        },
      },
    },
    sourcemap: true, // Helpful for debugging
    minify: 'esbuild',
  },
});
