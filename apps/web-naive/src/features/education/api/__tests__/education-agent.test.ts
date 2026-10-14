import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import {
  generatePlan,
  generateReport,
  listTutorKnowledge,
  practice,
  teach,
} from '../education-agent';

describe('student tutor transport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses only student-scoped education endpoints and sends no student ID', async () => {
    await listTutorKnowledge();
    await teach({ knowledgeId: 2, style: 'textual' });
    await practice({ knowledgeId: 2, difficulty: 2, count: 3 });
    await generatePlan({ knowledgeId: 2, targetDate: '2026-11-01' });
    await generateReport({ period: '30d' });

    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/education/student-tutor/knowledge',
    );
    expect(requestMock.post.mock.calls.map(([url]) => url)).toEqual([
      '/api/education/student-tutor/teach',
      '/api/education/student-tutor/practice',
      '/api/education/student-tutor/plan',
      '/api/education/student-tutor/report',
    ]);
    for (const [, body] of requestMock.post.mock.calls) {
      expect(body).not.toHaveProperty('studentId');
    }
  });
});
