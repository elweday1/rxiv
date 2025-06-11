import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'rxCreateElement',
    jsxFragment: 'rxFragment',
  },
});