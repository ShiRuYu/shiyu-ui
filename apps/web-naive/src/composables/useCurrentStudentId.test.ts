import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCurrentStudentMock = vi.hoisted(() => vi.fn());

vi.mock('#/features/education/api/student', () => ({
  getCurrentStudent: getCurrentStudentMock,
}));

import { useCurrentStudentId } from './useCurrentStudentId';

describe('useCurrentStudentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the student from the authenticated server session', async () => {
    getCurrentStudentMock.mockResolvedValue({ id: 42, name: 'Student' });

    await expect(useCurrentStudentId().getCurrentStudentId()).resolves.toBe(42);
    expect(getCurrentStudentMock).toHaveBeenCalledOnce();
  });

  it('rejects missing enrollment instead of silently using another student', async () => {
    getCurrentStudentMock.mockResolvedValue(null);

    await expect(useCurrentStudentId().getCurrentStudentId()).rejects.toThrow(
      '当前账号未关联学生档案',
    );
  });

  it('rejects an invalid server student id', async () => {
    getCurrentStudentMock.mockResolvedValue({ id: 0 });

    await expect(useCurrentStudentId().getCurrentStudentId()).rejects.toThrow(
      '当前账号未关联学生档案',
    );
  });
});
