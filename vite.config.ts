import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'maplibre-layer-counter',
      formats: ['es', 'umd'],
      name: 'MapLibreLayerCounter',
    },
    minify: 'esbuild',
    rollupOptions: {
      external: ['maplibre-gl'],
      output: {
        globals: {
          'maplibre-gl': 'maplibregl',
        },
      },
    },
    sourcemap: true,
  },
});
