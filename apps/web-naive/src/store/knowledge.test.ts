import type {
  KnowledgeDifficultyScale,
  KnowledgeSpace,
} from '#/features/knowledge/api/enterprise';

import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const knowledgeApiMock = vi.hoisted(() => ({
  getDifficultyScale: vi.fn(),
  getKnowledgeDomainLabel: vi.fn((value?: string) => value ?? '通用'),
  getSpaces: vi.fn(),
}));

vi.mock('#/features/knowledge/api/enterprise', () => knowledgeApiMock);

import { useKnowledgeStore } from './knowledge';

const defaultSpace: KnowledgeSpace = {
  accessMode: 'PRIVATE',
  activeIndexVersion: 1,
  bindingMode: 'OPTIONAL',
  chunkOverlap: 100,
  chunkSize: 500,
  chunkStrategy: 'HEADING',
  code: 'default',
  createTime: '',
  difficultyScaleId: 1,
  domainCode: 'GENERAL',
  embeddingProfile: 'default',
  id: 7,
  name: 'Default',
  rerankProfile: 'default',
  reviewMode: 'OPTIONAL',
  status: 1,
  updateTime: '',
};
const defaultScale: KnowledgeDifficultyScale = {
  code: 'default',
  id: 1,
  levelCount: 1,
  levels: [{ label: 'Basic', level: 1 }],
  name: 'Default scale',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('knowledge store persistence fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    knowledgeApiMock.getSpaces.mockResolvedValue({
      items: [defaultSpace],
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

  it('keeps the current difficulty scale when an earlier space responds late', async () => {
    const store = useKnowledgeStore();
    await store.loadSpaces();
    store.spaces.push({ ...store.spaces[0]!, id: 8, code: 'second' });
    const first = deferred<KnowledgeDifficultyScale>();
    const second = deferred<KnowledgeDifficultyScale>();
    knowledgeApiMock.getDifficultyScale
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const earlierLoad = store.loadDifficultyScale();
    const switchRequest = store.switchSpace(8);
    second.resolve({ ...defaultScale, name: 'Current scale' });
    await switchRequest;
    first.resolve({ ...defaultScale, name: 'Old scale' });
    await earlierLoad;

    expect(store.activeSpaceId).toBe(8);
    expect(store.difficultyScale?.name).toBe('Current scale');
  });

  it('does not restore pending spaces after reset', async () => {
    const result = deferred<{ items: KnowledgeSpace[] }>();
    knowledgeApiMock.getSpaces.mockReturnValueOnce(result.promise);
    const store = useKnowledgeStore();
    const oldLoad = store.loadSpaces();

    store.$reset();
    result.resolve({ items: [defaultSpace] });
    await oldLoad;

    expect(store.spaces).toEqual([]);
    expect(store.activeSpaceId).toBeUndefined();
    expect(store.difficultyScale).toBeUndefined();
  });

  it('does not restore a pending difficulty scale after reset', async () => {
    const store = useKnowledgeStore();
    await store.loadSpaces();
    const result = deferred<KnowledgeDifficultyScale>();
    knowledgeApiMock.getDifficultyScale.mockReturnValueOnce(result.promise);
    const oldLoad = store.loadDifficultyScale();

    store.$reset();
    result.resolve({ ...defaultScale, name: 'Old account scale' });
    await oldLoad;

    expect(store.difficultyScale).toBeUndefined();
  });
});
