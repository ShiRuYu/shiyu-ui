import { describe, expect, it } from 'vitest';

import routes from '../routes/static/workbench';

describe('workbench route contract', () => {
  it('uses a reachable parent route with the canonical overview page', () => {
    const dashboard = routes[0];

    expect(dashboard).toMatchObject({
      name: 'Dashboard',
      path: '/dashboard',
      redirect: '/dashboard/overview',
    });
    expect(dashboard?.children).toEqual([
      expect.objectContaining({
        name: 'Overview',
        path: 'overview',
      }),
    ]);
  });
});
