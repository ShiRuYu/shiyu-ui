import { computed, ref, shallowRef } from 'vue';

import { defineStore } from 'pinia';

import {
  getDifficultyScale,
  getSpaces,
  type KnowledgeDifficultyScale,
  type KnowledgeSpace,
} from '#/api/knowledge/enterprise';

const ACTIVE_SPACE_KEY = 'shiyu-knowledge-active-space';
const ACTIVE_SPACE_MANUAL_KEY = 'shiyu-knowledge-active-space-manual';

export const useKnowledgeStore = defineStore('knowledge', () => {
  const spaces = ref<KnowledgeSpace[]>([]);
  const difficultyScale = ref<KnowledgeDifficultyScale>();
  const activeSpaceId = shallowRef<number>();
  const loading = shallowRef(false);
  const switching = shallowRef(false);
  let loadPromise: null | Promise<void> = null;

  const activeSpace = computed(() =>
    spaces.value.find((space) => space.id === activeSpaceId.value),
  );
  const spaceOptions = computed(() =>
    spaces.value.map((space) => ({
      label: space.name,
      value: space.id,
    })),
  );

  async function loadSpaces(force = false) {
    if (!force && spaces.value.length > 0) return;
    if (loadPromise) return loadPromise;
    loading.value = true;
    loadPromise = (async () => {
      try {
        const result = await getSpaces({ pageNum: 1, pageSize: 100 });
        spaces.value = result.items;
        const savedId = Number(localStorage.getItem(ACTIVE_SPACE_KEY));
        const hasManualSelection =
          localStorage.getItem(ACTIVE_SPACE_MANUAL_KEY) === '1';
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
          localStorage.setItem(ACTIVE_SPACE_KEY, String(activeSpaceId.value));
        }
        // The difficulty scale is optional metadata. A space without a valid
        // scale must not prevent the rest of the knowledge workspace (points,
        // documents and graph) from loading.
        await loadDifficultyScale();
      } finally {
        loading.value = false;
        loadPromise = null;
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
        localStorage.setItem(ACTIVE_SPACE_KEY, String(spaceId));
        localStorage.setItem(ACTIVE_SPACE_MANUAL_KEY, '1');
      } else {
        localStorage.removeItem(ACTIVE_SPACE_KEY);
        localStorage.removeItem(ACTIVE_SPACE_MANUAL_KEY);
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
