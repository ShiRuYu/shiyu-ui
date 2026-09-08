import { beforeEach, describe, expect, it, vi } from 'vitest';

const useUserStoreMock = vi.hoisted(() => vi.fn());

vi.mock('@vben/stores', () => ({
  useUserStore: useUserStoreMock,
}));

import { useCurrentStudentId } from './useCurrentStudentId';

describe('useCurrentStudentId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to the user field when extInfo contains malformed JSON', () => {
    useUserStoreMock.mockReturnValue({
      userInfo: { extInfo: '{malformed', studentId: 42 },
    });

    expect(useCurrentStudentId().getCurrentStudentId()).toBe(42);
  });

  it('uses the development default when no usable student id exists', () => {
    useUserStoreMock.mockReturnValue({
      userInfo: { extInfo: '{malformed' },
    });

    expect(useCurrentStudentId().getCurrentStudentId()).toBe(1);
  });

  it('normalizes numeric string metadata to a number', () => {
    useUserStoreMock.mockReturnValue({
      userInfo: { extInfo: JSON.stringify({ studentId: '42' }) },
    });

    expect(useCurrentStudentId().getCurrentStudentId()).toBe(42);
  });

  it('ignores invalid ids and falls back to a valid user field', () => {
    useUserStoreMock.mockReturnValue({
      userInfo: { extInfo: { studentId: 'not-a-number' }, studentId: 43 },
    });

    expect(useCurrentStudentId().getCurrentStudentId()).toBe(43);
  });
});
