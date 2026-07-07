<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Page } from '@vben/common-ui';
import {
  NCard, NButton, NSpace, NTag,
  NSkeleton, NAlert, useMessage, NProgress,
} from 'naive-ui';
import {
  rebuildIndex,
  getRebuildTasks,
  getRebuildTaskStatus,
  clearIndex,
} from '#/api/knowledge/index-rebuild';

const message = useMessage();
const indexStatus = ref<any>(null);
const loading = ref(false);
const rebuilding = ref(false);
const rebuildTaskId = ref<string | null>(null);
const taskStatus = ref<string | null>(null);  // PENDING / RUNNING / COMPLETED / FAILED
const taskProgress = ref(0);

async function loadStatus() {
  loading.value = true;
  try {
    const tasks = await getRebuildTasks();
    indexStatus.value = tasks;
  } catch {
    indexStatus.value = null;
  } finally { loading.value = false; }
}

async function handleRebuild() {
  rebuilding.value = true;
  rebuildTaskId.value = null;
  taskStatus.value = 'PENDING';
  taskProgress.value = 0;
  try {
    const res = await rebuildIndex();
    const tid = res?.taskId || res;
    rebuildTaskId.value = tid;
    taskStatus.value = 'PENDING';
    message.success('索引重建任务已提交');
    // Poll progress
    const poll = setInterval(async () => {
      if (!rebuildTaskId.value) { clearInterval(poll); return; }
      try {
        const progress = await getRebuildTaskStatus(rebuildTaskId.value);
        if (progress) {
          taskStatus.value = progress.status;
          taskProgress.value = progress.progress || 0;
        }
        if (progress?.status === 'COMPLETED' || progress?.status === 'DONE') {
          message.success('索引重建完成');
          clearInterval(poll);
          rebuilding.value = false;
          await loadStatus();
        } else if (progress?.status === 'FAILED') {
          message.error(progress.error || '索引重建失败');
          clearInterval(poll);
          rebuilding.value = false;
          await loadStatus();
        }
      } catch { /* ignore */ }
    }, 2000);
  } catch (e: any) {
    message.error(e.message || '重建失败');
    rebuilding.value = false;
    taskStatus.value = 'FAILED';
  }
}

async function handleClearIndex() {
  try {
    await clearIndex();
    message.success('索引已清除');
    await loadStatus();
  } catch (e: any) {
    message.error(e.message || '清除失败');
  }
}

onMounted(loadStatus);
</script>

<template>
  <Page auto-content-height>
    <NCard :title="$t('knowledge.index')" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NButton type="primary" :loading="rebuilding" :disabled="rebuilding" @click="handleRebuild">
            {{ $t('knowledge.rebuildIndex') }}
          </NButton>
          <NButton type="error" @click="handleClearIndex">
            {{ $t('knowledge.clearIndex') }}
          </NButton>
          <NButton @click="loadStatus">
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </template>

      <NSkeleton v-if="loading" :repeat="3" />

      <NAlert v-else-if="indexStatus" title="索引状态" type="info" :bordered="false" class="mb-4">
        <pre class="text-sm">{{ JSON.stringify(indexStatus, null, 2) }}</pre>
      </NAlert>

      <NAlert v-else title="索引信息" type="info" :bordered="false">
        尚未建立索引，点击「重建索引」按钮创建全文搜索索引。
      </NAlert>

      <!-- 任务进度显示 -->
      <NSpace v-if="rebuildTaskId" class="mt-4" vertical>
        <NSpace align="center">
          <NTag v-if="taskStatus === 'COMPLETED'" type="success">索引重建完成</NTag>
          <NTag v-else-if="taskStatus === 'FAILED'" type="error">索引重建失败</NTag>
          <NTag v-else type="warning">正在重建索引...</NTag>
          <span class="text-sm text-gray-500">任务ID: {{ rebuildTaskId }}</span>
        </NSpace>
        <NProgress
          v-if="taskStatus === 'RUNNING' || taskStatus === 'PENDING'"
          :percentage="taskProgress"
          :indicator-placement="'inside'"
          :height="20"
          processing
        />
        <NProgress
          v-else-if="taskStatus === 'COMPLETED'"
          :percentage="100"
          :indicator-placement="'inside'"
          :height="20"
          type="success"
        />
      </NSpace>
    </NCard>
  </Page>
</template>
