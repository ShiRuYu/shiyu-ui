<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NProgress,
  NSelect,
  NSkeleton,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  getJobs,
  type IngestionJob,
  rebuildSpaceIndex,
} from '#/api/knowledge/enterprise';
import { useKnowledgeStore } from '#/store';

const message = useMessage();
const knowledgeStore = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(knowledgeStore);
const indexTasks = ref<IngestionJob[]>([]);
const loading = ref(false);
const rebuilding = ref(false);
const rebuildTaskId = ref<number>();

async function loadStatus() {
  if (!activeSpaceId.value) {
    indexTasks.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await getJobs({
      pageNum: 1,
      pageSize: 20,
      spaceId: activeSpaceId.value,
    });
    indexTasks.value = result.items.filter(
      (task) => task.jobType === 'INDEX_REBUILD',
    );
  } finally {
    loading.value = false;
  }
}

async function handleRebuild() {
  if (!activeSpaceId.value) return;
  rebuilding.value = true;
  try {
    rebuildTaskId.value = await rebuildSpaceIndex(activeSpaceId.value);
    message.success('索引重建任务已提交');
    await loadStatus();
  } catch (error: any) {
    message.error(error.message || '重建失败');
  } finally {
    rebuilding.value = false;
  }
}

async function changeSpace(value: number) {
  knowledgeStore.setActiveSpace(value);
  await loadStatus();
}

onMounted(async () => {
  await knowledgeStore.loadSpaces();
  await loadStatus();
});
</script>

<template>
  <Page auto-content-height>
    <NCard :title="$t('knowledge.index')" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="activeSpaceId"
            :options="spaceOptions"
            style="width: 240px"
            @update:value="changeSpace"
          />
          <NButton
            type="primary"
            :loading="rebuilding"
            :disabled="!activeSpaceId"
            @click="handleRebuild"
          >
            {{ $t('knowledge.rebuildIndex') }}
          </NButton>
          <NButton @click="loadStatus">{{ $t('common.refresh') }}</NButton>
        </NSpace>
      </template>

      <NSkeleton v-if="loading" :repeat="3" />
      <NAlert
        v-else-if="!indexTasks.length"
        title="索引任务"
        type="info"
        :bordered="false"
      >
        当前空间暂无索引重建任务。
      </NAlert>
      <NSpace v-else vertical>
        <NCard v-for="task in indexTasks" :key="task.id" size="small">
          <NSpace justify="space-between">
            <span>任务 #{{ task.id }} · {{ task.stage }}</span>
            <NTag :type="task.status === 'SUCCEEDED' ? 'success' : 'warning'">
              {{ task.status }}
            </NTag>
          </NSpace>
          <NProgress
            class="mt-2"
            :percentage="task.progress"
            :status="task.status === 'FAILED' ? 'error' : 'default'"
          />
        </NCard>
      </NSpace>

      <NAlert
        v-if="rebuildTaskId"
        type="success"
        :bordered="false"
        class="mt-4"
      >
        已提交索引重建任务 #{{ rebuildTaskId }}。
      </NAlert>
    </NCard>
  </Page>
</template>
