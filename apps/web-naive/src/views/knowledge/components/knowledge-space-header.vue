<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { NButton, NCard, NSelect, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import { getKnowledgeDomainLabel } from '#/api/knowledge/enterprise';
import { useKnowledgeStore } from '#/store';

import KnowledgeStatusTag from './knowledge-status-tag.vue';

defineProps<{ loading?: boolean; showImport?: boolean }>();
const emit = defineEmits<{ import: []; refresh: [] }>();

const router = useRouter();
const store = useKnowledgeStore();
const { activeSpace, activeSpaceId, spaceOptions, switching } =
  storeToRefs(store);

const subtitle = computed(() => {
  const space = activeSpace.value;
  if (!space) return '选择一个知识空间后开始管理内容';
  return space.description || `空间编码：${space.code}`;
});

async function changeSpace(value: null | number) {
  if (!value) return;
  await store.switchSpace(value);
  emit('refresh');
}
</script>

<template>
  <NCard :bordered="false" class="mb-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="truncate text-xl font-semibold">
            {{ activeSpace?.name || '未选择知识空间' }}
          </h2>
          <NTag v-if="activeSpace" size="small">{{ activeSpace.code }}</NTag>
          <NTag v-if="activeSpace" size="small" type="info">
            {{ getKnowledgeDomainLabel(activeSpace.domainCode) }}
          </NTag>
          <KnowledgeStatusTag
            v-if="activeSpace"
            :value="activeSpace.reviewMode"
          />
        </div>
        <p class="mt-1 max-w-3xl truncate text-sm text-muted-foreground">
          {{ subtitle }}
        </p>
        <div
          v-if="activeSpace"
          class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground"
        >
          <span>索引版本 v{{ activeSpace.activeIndexVersion }}</span>
          <span
            >分块 {{ activeSpace.chunkSize }}/{{
              activeSpace.chunkOverlap
            }}</span
          >
          <span
            >更新于
            {{ new Date(activeSpace.updateTime).toLocaleString() }}</span
          >
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NSelect
          :value="activeSpaceId"
          :options="spaceOptions"
          :loading="switching"
          class="w-60"
          placeholder="选择知识空间"
          @update:value="changeSpace"
        />
        <NButton :loading="loading" @click="emit('refresh')">刷新</NButton>
        <NButton @click="router.push('/knowledge/spaces')">空间设置</NButton>
        <NButton v-if="showImport" type="primary" @click="emit('import')">
          导入文档
        </NButton>
      </div>
    </div>
  </NCard>
</template>
