import path, { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@framework': path.resolve(__dirname, './src/framework'),
    }
  },
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
    jsxDev: false,
    jsx: 'automatic',
    jsxImportSource: "@framework",
  },
});