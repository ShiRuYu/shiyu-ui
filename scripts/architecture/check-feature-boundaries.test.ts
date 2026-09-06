import { describe, expect, it } from 'vitest';

import { findBoundaryViolations } from './check-feature-boundaries.mjs';

describe('feature slice boundaries', () => {
  it('allows app shell and sibling features to use a feature public entry', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/app/router.ts',
        "import { routes } from '#/features/agent';",
      ),
    ).toEqual([]);
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/features/education/model/lesson.ts',
        "import type { AgentId } from '#/features/agent';",
      ),
    ).toEqual([]);
  });

  it.each([
    [
      'features/agent/example.ts',
      '../knowledge/api/search',
      'feature-public-entry',
    ],
    [
      'app/router.ts',
      '../features/agent/pages/editor.vue',
      'app-feature-public-entry',
    ],
    [
      'shared/http/result.ts',
      '../../features/agent',
      'shared-no-feature-dependency',
    ],
    ['features/agent/example.ts', '../../views/chat', 'legacy-view-import'],
    ['features/agent/example.ts', '../../api/request', 'legacy-api-import'],
  ])('checks relative imports from %s', (file, target, rule) => {
    expect(
      findBoundaryViolations(
        `apps/web-naive/src/${file}`,
        `export { value } from '${target}';`,
      ),
    ).toEqual([expect.objectContaining({ rule, specifier: target })]);
  });

  it.each([
    '../knowledge',
    '../knowledge/index.ts',
    '#/features/knowledge/index',
    './api/search',
  ])('allows public entries and same-feature imports: %s', (target) => {
    expect(
      findBoundaryViolations(
        'E:\\Dev\\shiyu\\shiyu-ui\\apps\\web-naive\\src\\features\\agent\\example.ts',
        `const page = () => import('${target}');`,
      ),
    ).toEqual([]);
  });

  it('rejects deep imports into another feature', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/features/education/model/lesson.ts',
        "import { useDraft } from '#/features/agent/composables/use-draft';",
      ),
    ).toEqual([
      expect.objectContaining({
        rule: 'feature-public-entry',
        specifier: '#/features/agent/composables/use-draft',
      }),
    ]);
  });

  it('rejects shared code depending on a feature', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/shared/http/result.ts',
        "export { agentFacade } from '#/features/agent';",
      ),
    ).toEqual([
      expect.objectContaining({ rule: 'shared-no-feature-dependency' }),
    ]);
  });

  it('rejects app shell deep imports', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/app/router.ts',
        "const page = () => import('#/features/agent/pages/editor.vue');",
      ),
    ).toEqual([expect.objectContaining({ rule: 'app-feature-public-entry' })]);
  });

  it('rejects legacy api aliases outside the adapter directory', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/views/agent/index.vue',
        "import { chatStream } from '#/api/agent/chat';",
      ),
    ).toEqual([
      expect.objectContaining({
        rule: 'legacy-api-import',
        specifier: '#/api/agent/chat',
      }),
    ]);
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/api/agent/chat.ts',
        "import { requestClient } from '#/api/request';",
      ),
    ).toEqual([]);
  });

  it('rejects legacy views imports', () => {
    expect(
      findBoundaryViolations(
        'apps/web-naive/src/features/agent/pages/editor.vue',
        "const page = () => import('#/views/workspace/chat/index.vue');",
      ),
    ).toEqual([
      expect.objectContaining({
        rule: 'legacy-view-import',
        specifier: '#/views/workspace/chat/index.vue',
      }),
    ]);
  });
});
