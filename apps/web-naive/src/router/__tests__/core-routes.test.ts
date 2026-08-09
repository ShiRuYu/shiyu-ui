import { describe, expect, it } from 'vitest';

import { coreRoutes } from '../routes/core';

describe('core recovery routes', () => {
  it('keeps menu load recovery reachable without dynamic access', () => {
    const root = coreRoutes.find((route) => route.name === 'Root');
    const recovery = root?.children?.find(
      (route) => route.name === 'MenuLoadError',
    );

    expect(recovery).toMatchObject({
      path: '/menu-load-error',
      meta: {
        hideInMenu: true,
        ignoreAccess: true,
      },
    });
  });
});
