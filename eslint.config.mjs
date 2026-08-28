import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    // OpenAPI output is formatted by the generation script with oxfmt.
    ignores: ['apps/web-naive/src/shared/api/generated/schema.ts'],
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Oxfmt owns template whitespace and intentionally wraps some closing
      // brackets, so enforcing the opposite style here causes a fix loop.
      'vue/html-closing-bracket-newline': 'off',
    },
  },
]);
