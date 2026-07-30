import { defineConfig } from '@vben/eslint-config';

export default defineConfig([
  {
    files: ['**/*.vue'],
    rules: {
      // Oxfmt owns template whitespace and intentionally wraps some closing
      // brackets, so enforcing the opposite style here causes a fix loop.
      'vue/html-closing-bracket-newline': 'off',
    },
  },
]);
