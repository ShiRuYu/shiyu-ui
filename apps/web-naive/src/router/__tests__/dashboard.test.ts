import { describe, expect, it } from 'vitest';

import routes from '../routes/static/workbench';

describe('workbench route contract', () => {
  it('uses a reachable parent route with the canonical overview page', () => {
    const workbench = routes[0];

    expect(workbench).toMatchObject({
      name: 'Workbench',
      path: '/workbench',
      redirect: '/workbench/overview',
    });
    expect(workbench?.children).toEqual([
      expect.objectContaining({
        name: 'Overview',
        path: 'overview',
      }),
    ]);
  });
});
