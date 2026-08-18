import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import routes from '../routes/static/workflow';

function flattenPaths(
  values: typeof routes,
  parent = '',
): string[] {
  return values.flatMap((route) => {
    const path = route.path.startsWith('/')
      ? route.path
      : `${parent}/${route.path}`;
    return [
      path,
      ...flattenPaths((route.children ?? []) as typeof routes, path),
    ];
  });
}

describe('workflow route contract', () => {
  it('registers every non-menu workflow used by action buttons', () => {
    const paths = flattenPaths(routes);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/app-studio/apps/edit',
        '/app-studio/agents/edit',
        '/education-center/practice/exams',
        '/education-center/practice/exams/take/:id',
        '/education-center/practice/exams/result/:id',
      ]),
    );
  });

  it('keeps workflow pages out of primary navigation', () => {
    for (const route of routes.flatMap((item) => item.children ?? [])) {
      expect(route.meta?.hideInMenu).toBe(true);
      expect(route.component).toBeDefined();
    }
  });

  it('resolves workflow URLs instead of falling through to the 404 route', () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    for (const path of [
      '/app-studio/apps/edit?new=true',
      '/app-studio/agents/edit?new=true',
      '/education-center/practice/exams',
      '/education-center/practice/exams/take/42',
      '/education-center/practice/exams/result/42',
    ]) {
      const resolved = router.resolve(path);
      expect(resolved.matched.at(-1)?.name).not.toBeUndefined();
      expect(resolved.matched.at(-1)?.name).not.toBe('FallbackNotFound');
    }
  });
});
