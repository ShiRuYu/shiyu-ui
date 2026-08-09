import { describe, expect, it } from 'vitest';

import routes from '../routes/modules/dashboard';

describe('workbench route contract', () => {
  it('uses a reachable parent route with relative children and legacy aliases', () => {
    const dashboard = routes[0];

    expect(dashboard).toMatchObject({
      name: 'Dashboard',
      path: '/dashboard',
      redirect: '/dashboard/overview',
    });
    expect(dashboard?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alias: '/analytics',
          name: 'Analytics',
          path: 'analytics',
        }),
        expect.objectContaining({
          alias: '/overview',
          name: 'Overview',
          path: 'overview',
        }),
      ]),
    );
  });
});
