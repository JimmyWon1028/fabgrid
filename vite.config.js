import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'node:path';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    base: './',
    root: isBuild ? 'demo' : '.',
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: 4174,
      strictPort: true
    },
    build: {
      outDir: isBuild ? '../dist-vue-demo' : 'dist-vue-demo',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          vue2Grid: resolve(process.cwd(), 'demo/vue2-grid-app.html')
        }
      }
    }
  };
});
