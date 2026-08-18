import { describe, expect, it } from 'vitest';

import { normalizeComponentPath, validateMenuContract } from '../menu-contract';

describe('backend menu contract', () => {
  it('maps backend component paths to Vite page registry keys', () => {
    expect(normalizeComponentPath('/learning/course/list')).toBe(
      '../views/learning/course/list.vue',
    );
    expect(normalizeComponentPath('/workspace/agent/index')).toBe(
      '../views/workspace/agent/index.vue',
    );
    expect(normalizeComponentPath('/workspace/chat/index')).toBe(
      '../views/workspace/chat/index.vue',
    );
  });

  it('accepts nested menus with registered components', () => {
    expect(() =>
      validateMenuContract(
        [
          {
            component: 'BasicLayout',
            name: 'Education',
            path: '/education',
            children: [
              {
                component: '/learning/course/list',
                name: 'CourseList',
                path: '/learning/course',
              },
            ],
          },
        ],
        ['../views/learning/course/list.vue'],
      ),
    ).not.toThrow();
  });

  it('rejects duplicate names and missing page components', () => {
    expect(() =>
      validateMenuContract(
        [
          {
            component: '/missing/page',
            name: 'Duplicate',
            path: '/one',
          },
          { component: '', name: 'Duplicate', path: '/two' },
        ],
        [],
      ),
    ).toThrow(/missing component/);
  });
});
