<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NButton, NSpace, NTag, NSkeleton, NAlert, useMessage } from 'naive-ui';
import { rebuildKnowledgeIndexApi, getRebuildIndexStatusApi, deleteKnowledgeIndexApi } from '#/api/knowledge';

const message = useMessage();
const indexStatus = ref<any>(null);
const loading = ref(false);
const rebuilding = ref(false);
const rebuildTaskId = ref<string | null>(null);

async function loadStatus() {
  loading.value = true;
  try {
    const res = await getRebuildIndexStatusApi();
    indexStatus.value = res;
  } catch {
    indexStatus.value = null;
  } finally { loading.value = false; }
}

async function handleRebuild() {
  rebuilding.value = true;
  try {
    const res = await rebuildKnowledgeIndexApi();
    rebuildTaskId.value = res?.taskId || res;
    message.success('索引重建任务已提交');
    // Poll progress
    const poll = setInterval(async () => {
      if (!rebuildTaskId.value) { clearInterval(poll); return; }
      try {
        const progress = await getRebuildIndexProgressApi(rebuildTaskId.value);
        if (progress?.status === 'COMPLETED' || progress?.status === 'DONE') {
          message.success('索引重建完成');
          clearInterval(poll);
          rebuilding.value = false;
          await loadStatus();
        }
      } catch { /* ignore */ }
    }, 2000);
  } catch (e: any) {
    message.error(e.message || '重建失败');
    rebuilding.value = false;
  }
}

async function handleDeleteIndex() {
  try {
    await deleteKnowledgeIndexApi();
    message.success('索引已删除');
    await loadStatus();
  } catch (e: any) {
    message.error(e.message || '删除失败');
  }
}

onMounted(loadStatus);
</script>

<template>
  <NCard title="索引管理" :bordered="false">
    <template #header-extra>
      <NSpace>
        <NButton type="primary" :loading="rebuilding" @click="handleRebuild" :disabled="rebuilding">重建索引</NButton>
        <NButton type="error" @click="handleDeleteIndex">删除索引</NButton>
        <NButton @click="loadStatus">刷新状态</NButton>
      </NSpace>
    </template>

    <NSkeleton v-if="loading" :repeat="3" />

    <NAlert v-else-if="indexStatus" title="索引状态" type="info" :bordered="false" class="mb-4">
      <pre class="text-sm">{{ JSON.stringify(indexStatus, null, 2) }}</pre>
    </NAlert>

    <NAlert v-else title="索引信息" type="info" :bordered="false">
      尚未建立索引，点击「重建索引」按钮创建全文搜索索引。
    </NAlert>

    <NSpace v-if="rebuildTaskId" class="mt-4">
      <NTag type="warning">正在重建索引...</NTag>
      <span class="text-sm text-gray-500">任务ID: {{ rebuildTaskId }}</span>
    </NSpace>
  </NCard>
</template>
