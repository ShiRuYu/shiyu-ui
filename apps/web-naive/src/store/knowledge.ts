import { computed, ref, shallowRef } from 'vue';

import { defineStore } from 'pinia';

import {
  getDifficultyScale,
  getKnowledgeDomainLabel,
  getSpaces,
  type KnowledgeDifficultyScale,
  type KnowledgeDomainCode,
  type KnowledgeSpace,
} from '#/api/knowledge/enterprise';

const ACTIVE_SPACE_KEY = 'shiyu-knowledge-active-space';
const ACTIVE_SPACE_MANUAL_KEY = 'shiyu-knowledge-active-space-manual';
const PLATFORM_SCOPE = 'PLATFORM';

function storageKey(prefix: string, domainCode?: KnowledgeDomainCode) {
  return `${prefix}:${domainCode || PLATFORM_SCOPE}`;
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
    if (
      !force &&
      spaces.value.length > 0 &&
      loadedDomainCode.value === domainCode
    )
      return;
    if (loadPromise) {
      if (loadPromiseDomain === domainCode) return loadPromise;
      await loadPromise;
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
        // The platform entry manages all non-education spaces. The education
        // entry is explicitly scoped by the server to EDUCATION.
        spaces.value = domainCode
          ? result.items
          : result.items.filter((space) => space.domainCode !== 'EDUCATION');
        loadedDomainCode.value = domainCode;
        const savedId = Number(
          localStorage.getItem(storageKey(ACTIVE_SPACE_KEY, domainCode)),
        );
        const hasManualSelection =
          localStorage.getItem(
            storageKey(ACTIVE_SPACE_MANUAL_KEY, domainCode),
          ) === '1';
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
          localStorage.setItem(
            storageKey(ACTIVE_SPACE_KEY, domainCode),
            String(activeSpaceId.value),
          );
        }
        // The difficulty scale is optional metadata. A space without a valid
        // scale must not prevent the rest of the knowledge workspace (points,
        // documents and graph) from loading.
        await loadDifficultyScale();
      } finally {
        loading.value = false;
        loadPromise = null;
        loadPromiseDomain = undefined;
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
        localStorage.setItem(
          storageKey(ACTIVE_SPACE_KEY, loadedDomainCode.value),
          String(spaceId),
        );
        localStorage.setItem(
          storageKey(ACTIVE_SPACE_MANUAL_KEY, loadedDomainCode.value),
          '1',
        );
      } else {
        localStorage.removeItem(
          storageKey(ACTIVE_SPACE_KEY, loadedDomainCode.value),
        );
        localStorage.removeItem(
          storageKey(ACTIVE_SPACE_MANUAL_KEY, loadedDomainCode.value),
        );
      }
    }
  }

  async function switchSpace(spaceId: number) {
    if (activeSpaceId.value === spaceId) return;
    switching.value = true;
    try {
      setActiveSpace(spaceId);
      await loadDifficultyScale(spaceId);
    } finally {
      switching.value = false;
    }
  }

  async function loadDifficultyScale(spaceId = activeSpaceId.value) {
    if (!spaceId) {
      difficultyScale.value = undefined;
      return;
    }
    try {
      difficultyScale.value = await getDifficultyScale(spaceId);
    } catch (error) {
      difficultyScale.value = undefined;
      // Keep space switching and graph loading usable when an older or newly
      // created space has no difficulty-scale seed data yet.
      console.warn(
        `Unable to load difficulty scale for space ${spaceId}`,
        error,
      );
    }
  }

  function $reset() {
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
