import { describe, expect, it } from 'vitest';

import { normalizeComponentPath, validateMenuContract } from '../menu-contract';

describe('backend menu contract', () => {
  it('maps backend component paths to Vite page registry keys', () => {
    expect(normalizeComponentPath('/education-center/learning/index')).toBe(
      '../views/education-center/learning/index.vue',
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
                component: '/education-center/learning/index',
                name: 'EducationLearning',
                path: '/education-center/learning',
              },
            ],
          },
        ],
        ['../views/education-center/learning/index.vue'],
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
