import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:9000',
            ws: true,
          },
        },
      },
    },
  };
});
