import { dirname, resolve } from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'maplibre-layer-factory',
      formats: ['es', 'umd'],
      name: 'MapLibreLayerFactory',
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
