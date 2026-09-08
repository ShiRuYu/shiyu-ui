import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const knowledgeApiMock = vi.hoisted(() => ({
  getDifficultyScale: vi.fn(),
  getKnowledgeDomainLabel: vi.fn((value?: string) => value ?? '通用'),
  getSpaces: vi.fn(),
}));

vi.mock('#/features/knowledge/api/enterprise', () => knowledgeApiMock);

import { useKnowledgeStore } from './knowledge';

describe('knowledge store persistence fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    knowledgeApiMock.getSpaces.mockResolvedValue({
      items: [
        {
          code: 'default',
          domainCode: 'GENERAL',
          id: 7,
          name: 'Default',
        },
      ],
    });
    knowledgeApiMock.getDifficultyScale.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('continues loading spaces when browser storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new DOMException('storage is unavailable', 'SecurityError');
      }),
      removeItem: vi.fn(() => {
        throw new DOMException('storage is unavailable', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('storage is unavailable', 'SecurityError');
      }),
    });

    const store = useKnowledgeStore();

    await expect(store.loadSpaces()).resolves.toBeUndefined();
    expect(store.activeSpaceId).toBe(7);
    expect(store.spaces).toHaveLength(1);
    expect(() => store.setActiveSpace()).not.toThrow();
    expect(store.activeSpaceId).toBeUndefined();
  });
});
