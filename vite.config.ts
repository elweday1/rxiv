import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    // Tell Vite to build a library
    lib: {
      // The entry point for your library
      entry: resolve(__dirname, 'src/framework/index.ts'),
      name: 'RXIV',
      // The output file name for different formats
      fileName: (format) => `rxiv.${format}.js`,
    },
    // Specify the output directory
    outDir: 'dist',
  },
  plugins: [
    // This plugin generates the .d.ts files
    dts({
      insertTypesEntry: true,
    }),
  ],
  // This tells Vite how to handle JSX
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: "'./framework'", // Note the quotes inside quotes
  },
});