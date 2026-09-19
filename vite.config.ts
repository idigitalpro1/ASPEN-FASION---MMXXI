import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      'process.env': JSON.stringify({
        API_KEY: env.API_KEY || env.GEMINI_API_KEY || '',
        GEMINI_API_KEY: env.GEMINI_API_KEY || env.API_KEY || '',
      }),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'node-fetch': path.resolve(__dirname, 'src/node-fetch-stub.ts'),
        'cross-fetch': path.resolve(__dirname, 'src/node-fetch-stub.ts'),
        'cross-fetch/polyfill': path.resolve(__dirname, 'src/node-fetch-stub.ts'),
        'whatwg-fetch': path.resolve(__dirname, 'src/node-fetch-stub.ts'),
        'formdata-polyfill': path.resolve(__dirname, 'src/node-fetch-stub.ts'),
      },
    },
    optimizeDeps: {
      exclude: ['node-fetch', 'cross-fetch', 'cross-fetch/polyfill', 'whatwg-fetch', 'formdata-polyfill'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-genai': ['@google/genai'],
          },
        },
      },
    },
  };
});
