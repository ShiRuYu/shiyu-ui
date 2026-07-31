import { computed, ref, shallowRef } from 'vue';

import { defineStore } from 'pinia';

import {
  getDifficultyScale,
  getSpaces,
  type KnowledgeDifficultyScale,
  type KnowledgeSpace,
} from '#/api/knowledge/enterprise';

export const useKnowledgeStore = defineStore('knowledge', () => {
  const spaces = ref<KnowledgeSpace[]>([]);
  const difficultyScale = ref<KnowledgeDifficultyScale>();
  const activeSpaceId = shallowRef<number>();
  const loading = shallowRef(false);

  const activeSpace = computed(() =>
    spaces.value.find((space) => space.id === activeSpaceId.value),
  );
  const spaceOptions = computed(() =>
    spaces.value.map((space) => ({
      label: space.name,
      value: space.id,
    })),
  );

  async function loadSpaces() {
    loading.value = true;
    try {
      const result = await getSpaces({ pageNum: 1, pageSize: 100 });
      spaces.value = result.items;
      if (
        activeSpaceId.value === undefined ||
        !spaces.value.some((space) => space.id === activeSpaceId.value)
      ) {
        activeSpaceId.value = spaces.value[0]?.id;
      }
      await loadDifficultyScale();
    } finally {
      loading.value = false;
    }
  }

  function setActiveSpace(spaceId?: number) {
    if (
      spaceId === undefined ||
      spaces.value.some((space) => space.id === spaceId)
    ) {
      activeSpaceId.value = spaceId;
    }
  }

  async function loadDifficultyScale(spaceId = activeSpaceId.value) {
    if (!spaceId) {
      difficultyScale.value = undefined;
      return;
    }
    difficultyScale.value = await getDifficultyScale(spaceId);
  }

  function $reset() {
    spaces.value = [];
    difficultyScale.value = undefined;
    activeSpaceId.value = undefined;
    loading.value = false;
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
    spaceOptions,
    spaces,
  };
});
