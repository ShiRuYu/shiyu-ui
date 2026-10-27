import type {
  KnowledgeDifficultyScale,
  KnowledgeDomainCode,
  KnowledgeSpace,
} from '#/features/knowledge/api/enterprise';

import { computed, ref, shallowRef } from 'vue';

import { defineStore } from 'pinia';

import {
  getDifficultyScale,
  getKnowledgeDomainLabel,
  getSpaces,
} from '#/features/knowledge/api/enterprise';

const ACTIVE_SPACE_KEY = 'shiyu-knowledge-active-space';
const ACTIVE_SPACE_MANUAL_KEY = 'shiyu-knowledge-active-space-manual';
const PLATFORM_SCOPE = 'PLATFORM';

function storageKey(prefix: string, domainCode?: KnowledgeDomainCode) {
  return `${prefix}:${domainCode || PLATFORM_SCOPE}`;
}

function readStorage(key: string) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Workspace selection is a convenience preference; storage failures must
    // not prevent the knowledge workspace from loading.
  }
}

function removeStorage(key: string) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Ignore unavailable or quota-limited browser storage.
  }
}

export const useKnowledgeStore = defineStore('knowledge', () => {
  const spaces = ref<KnowledgeSpace[]>([]);
  const difficultyScale = ref<KnowledgeDifficultyScale>();
  const activeSpaceId = shallowRef<number>();
  const loading = shallowRef(false);
  const switching = shallowRef(false);
  const loadedDomainCode = shallowRef<KnowledgeDomainCode>();
  let loadPromise: null | Promise<void> = null;
  let loadPromiseDomain: KnowledgeDomainCode | undefined;
  let generation = 0;
  let latestScaleRequest = 0;
  let latestSwitchRequest = 0;

  const activeSpace = computed(() =>
    spaces.value.find((space) => space.id === activeSpaceId.value),
  );
  const spaceOptions = computed(() =>
    spaces.value.map((space) => ({
      label: `${space.name} · ${getKnowledgeDomainLabel(space.domainCode)}`,
      value: space.id,
    })),
  );

  async function loadSpaces(force = false, domainCode?: KnowledgeDomainCode) {
    const requestGeneration = generation;
    if (
      !force &&
      spaces.value.length > 0 &&
      loadedDomainCode.value === domainCode
    )
      return;
    if (loadPromise) {
      if (loadPromiseDomain === domainCode) return loadPromise;
      await loadPromise;
      if (requestGeneration !== generation) return;
      return loadSpaces(force, domainCode);
    }
    loading.value = true;
    loadPromiseDomain = domainCode;
    loadPromise = (async () => {
      try {
        const result = await getSpaces({
          domainCode,
          pageNum: 1,
          pageSize: 100,
        });
        if (requestGeneration !== generation) return;
        // The platform entry manages all non-education spaces. The education
        // entry is explicitly scoped by the server to EDUCATION.
        spaces.value = domainCode
          ? result.items
          : result.items.filter((space) => space.domainCode !== 'EDUCATION');
        loadedDomainCode.value = domainCode;
        const savedId = Number(
          readStorage(storageKey(ACTIVE_SPACE_KEY, domainCode)),
        );
        const hasManualSelection =
          readStorage(storageKey(ACTIVE_SPACE_MANUAL_KEY, domainCode)) === '1';
        const defaultSpaceId = spaces.value.find(
          (space) => space.code === 'default',
        )?.id;
        if (
          activeSpaceId.value === undefined ||
          !spaces.value.some((space) => space.id === activeSpaceId.value)
        ) {
          activeSpaceId.value =
            hasManualSelection &&
            spaces.value.some((space) => space.id === savedId)
              ? savedId
              : (defaultSpaceId ?? spaces.value[0]?.id);
        }
        if (activeSpaceId.value) {
          writeStorage(
            storageKey(ACTIVE_SPACE_KEY, domainCode),
            String(activeSpaceId.value),
          );
        }
        // The difficulty scale is optional metadata. A space without a valid
        // scale must not prevent the rest of the knowledge workspace (points,
        // documents and graph) from loading.
        await loadDifficultyScale();
      } finally {
        if (requestGeneration === generation) {
          loading.value = false;
          loadPromise = null;
          loadPromiseDomain = undefined;
        }
      }
    })();
    return loadPromise;
  }

  function setActiveSpace(spaceId?: number) {
    if (
      spaceId === undefined ||
      spaces.value.some((space) => space.id === spaceId)
    ) {
      activeSpaceId.value = spaceId;
      if (spaceId) {
        writeStorage(
          storageKey(ACTIVE_SPACE_KEY, loadedDomainCode.value),
          String(spaceId),
        );
        writeStorage(
          storageKey(ACTIVE_SPACE_MANUAL_KEY, loadedDomainCode.value),
          '1',
        );
      } else {
        removeStorage(storageKey(ACTIVE_SPACE_KEY, loadedDomainCode.value));
        removeStorage(
          storageKey(ACTIVE_SPACE_MANUAL_KEY, loadedDomainCode.value),
        );
      }
    }
  }

  async function switchSpace(spaceId: number) {
    if (activeSpaceId.value === spaceId) return;
    const requestId = ++latestSwitchRequest;
    switching.value = true;
    try {
      setActiveSpace(spaceId);
      await loadDifficultyScale(spaceId);
    } finally {
      if (requestId === latestSwitchRequest) switching.value = false;
    }
  }

  async function loadDifficultyScale(spaceId = activeSpaceId.value) {
    const requestId = ++latestScaleRequest;
    difficultyScale.value = undefined;
    if (!spaceId) {
      return;
    }
    try {
      const result = await getDifficultyScale(spaceId);
      if (requestId !== latestScaleRequest || activeSpaceId.value !== spaceId)
        return;
      difficultyScale.value = result;
    } catch (error) {
      if (requestId !== latestScaleRequest || activeSpaceId.value !== spaceId)
        return;
      // Keep space switching and graph loading usable when an older or newly
      // created space has no difficulty-scale seed data yet.
      console.warn(
        `Unable to load difficulty scale for space ${spaceId}`,
        error,
      );
    }
  }

  function $reset() {
    generation += 1;
    latestScaleRequest += 1;
    latestSwitchRequest += 1;
    loadPromise = null;
    loadPromiseDomain = undefined;
    spaces.value = [];
    loadedDomainCode.value = undefined;
    difficultyScale.value = undefined;
    activeSpaceId.value = undefined;
    loading.value = false;
    switching.value = false;
  }

  return {
    $reset,
    activeSpace,
    activeSpaceId,
    difficultyScale,
    loadDifficultyScale,
    loadSpaces,
    loading,
    setActiveSpace,
    switchSpace,
    switching,
    spaceOptions,
    spaces,
  };
});
