<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NAlert, NButton, NCard, NTag, useMessage } from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  type BackupResult,
  checkEmbeddedBackup,
  createEmbeddedBackup,
  type EmbeddedRuntimeStatus,
  getEmbeddedRuntimeStatus,
} from '#/api/knowledge/enterprise';
import { useKnowledgeStore } from '#/store';
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpace } = storeToRefs(store);
const runtime = ref<EmbeddedRuntimeStatus>();
const backup = ref<BackupResult>();
async function refresh() {
  runtime.value = await getEmbeddedRuntimeStatus();
}
async function createBackup() {
  backup.value = await createEmbeddedBackup();
  message.success('备份已生成');
}
async function verify() {
  if (!backup.value) return;
  const result = await checkEmbeddedBackup(backup.value.fileName);
  result.valid
    ? message.success(`校验通过，共 ${result.entries} 条记录`)
    : message.error(result.errors.join('；'));
}
onMounted(async () => {
  await store.loadSpaces();
  await refresh();
});
</script>
<template>
  <Page
    title="系统运维"
    description="管理嵌入式存储、备份校验和运行安全状态，明确哪些操作会影响整个知识平台。"
  >
    <div class="grid gap-4 lg:grid-cols-2">
      <NCard title="运行状态">
        <NAlert
          :type="runtime?.singleWriter ? 'success' : 'warning'"
          :bordered="false"
        >
          {{ runtime?.singleWriter ? '单写实例锁已启用' : '实例锁状态待确认' }}
        </NAlert>
        <div v-if="runtime" class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">数据目录</span
            ><span>{{ runtime.dataRoot }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">数据库</span
            ><span>{{ runtime.database }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">可用空间</span
            ><span
              >{{
                (runtime.usableBytes / 1024 / 1024 / 1024).toFixed(2)
              }}
              GB</span
            >
          </div>
        </div>
        <NButton class="mt-5" @click="refresh">刷新状态</NButton>
</NCard
      ><NCard title="备份与恢复校验">
        <div class="text-sm leading-6 text-slate-500">
          完整备份包含数据库、上传文件、模型和索引目录。恢复前建议先在停机窗口执行校验。
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <NButton type="primary" @click="createBackup">立即备份</NButton
          ><NButton :disabled="!backup" @click="verify">校验最近备份</NButton>
        </div>
        <div v-if="backup" class="mt-4 text-sm">
          <NTag type="success">{{ backup.fileName }}</NTag
          ><span class="ml-2 text-slate-500"
            >{{ (backup.size / 1024 / 1024).toFixed(2) }} MB</span
          >
        </div>
      </NCard>
    </div>
    <NCard class="mt-4" title="当前空间配置">
      <div class="grid gap-3 md:grid-cols-4 text-sm">
        <div>
          <div class="text-slate-500">空间</div>
          <b>{{ activeSpace?.name || '-' }}</b>
        </div>
        <div>
          <div class="text-slate-500">索引版本</div>
          <b>{{ activeSpace?.activeIndexVersion ?? '-' }}</b>
        </div>
        <div>
          <div class="text-slate-500">向量模型</div>
          <b>{{ activeSpace?.embeddingProfile || '-' }}</b>
        </div>
        <div>
          <div class="text-slate-500">重排模型</div>
          <b>{{ activeSpace?.rerankProfile || '-' }}</b>
        </div>
      </div>
    </NCard>
  </Page>
</template>
