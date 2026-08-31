import { describe, expect, it } from 'vitest';

import { generateRoutesByBackend } from '../generate-routes-backend';

describe('generateRoutesByBackend', () => {
  it('resolves semantic feature component keys from backend menus', async () => {
    const page = () => Promise.resolve({});

    const [route] = await generateRoutesByBackend({
      fetchMenuListAsync: async () => [
        {
          component: 'feature:iam.files',
          name: 'FileManagement',
          path: '/system/file',
        },
      ],
      pageMap: { 'feature:iam.files': page },
    });

    expect(route.component).toBe(page);
  });

  it('continues resolving normalized legacy view keys for existing callers', async () => {
    const page = () => Promise.resolve({});

    const [route] = await generateRoutesByBackend({
      fetchMenuListAsync: async () => [
        {
          component: '/system/file.vue',
          name: 'FileManagement',
          path: '/system/file',
        },
      ],
      pageMap: { '/system/file.vue': page },
    });

    expect(route.component).toBe(page);
  });
});
