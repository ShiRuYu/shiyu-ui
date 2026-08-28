import { describe, expect, it } from 'vitest';

import { normalizeComponentKey, validateMenuContract } from '../menu-contract';

describe('backend menu contract', () => {
  it('accepts semantic feature component keys', () => {
    expect(normalizeComponentKey('feature:education.learning')).toBe(
      'feature:education.learning',
    );
  });

  it('rejects legacy component paths', () => {
    expect(() => normalizeComponentKey('/workspace/chat/index')).toThrow(
      /semantic feature key/,
    );
  });

  it('accepts nested menus with registered feature components', () => {
    expect(() =>
      validateMenuContract(
        [
          {
            component: 'BasicLayout',
            name: 'Education',
            path: '/education',
            children: [
              {
                component: 'feature:education.learning',
                name: 'EducationLearning',
                path: '/education-center/learning',
              },
            ],
          },
        ],
        ['feature:education.learning'],
      ),
    ).not.toThrow();
  });

  it('rejects invalid and missing page components', () => {
    expect(() =>
      validateMenuContract(
        [
          {
            component: 'feature:education.missing',
            name: 'Missing',
            path: '/missing',
          },
        ],
        [],
      ),
    ).toThrow(/missing component/);
    expect(() =>
      validateMenuContract(
        [{ component: '/missing/page', name: 'Legacy', path: '/legacy' }],
        [],
      ),
    ).toThrow(/semantic feature key/);
  });
});
