<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDataTable,
  NProgress,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  type BackupResult,
  checkEmbeddedBackup,
  createEmbeddedBackup,
  type EmbeddedRuntimeStatus,
  getEmbeddedRuntimeStatus,
  getKnowledgeAudits,
  type KnowledgeAuditLog,
} from '#/api/knowledge/enterprise';
import { dialog } from '#/adapter/naive';
import { useKnowledgeStore } from '#/store';

import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';
import KnowledgeStatusTag from '../components/knowledge-status-tag.vue';

const message = useMessage();
const store = useKnowledgeStore();
const { activeSpace } = storeToRefs(store);
const runtime = ref<EmbeddedRuntimeStatus>();
const backup = ref<BackupResult>();
const refreshing = ref(false);
const backingUp = ref(false);
const verifying = ref(false);
const verifyResult = ref<{
  entries: number;
  errors: string[];
  valid: boolean;
}>();
const audits = ref<KnowledgeAuditLog[]>([]);
const auditTotal = ref(0);
const auditLoading = ref(false);
const auditPagination = reactive({ page: 1, pageSize: 10 });
const auditColumns: DataTableColumns<KnowledgeAuditLog> = [
  {
    key: 'createTime',
    title: '时间',
    width: 180,
    render: (row) => new Date(row.createTime).toLocaleString(),
  },
  { key: 'resourceType', title: '资源', width: 120 },
  { key: 'action', title: '操作', width: 140 },
  {
    key: 'resourceId',
    title: '资源 ID',
    width: 100,
    render: (row) => row.resourceId ?? '-',
  },
  {
    key: 'detailJson',
    title: '详情',
    ellipsis: { tooltip: true },
    render: (row) => row.detailJson || '-',
  },
];
const diskPercent = computed(() =>
  runtime.value?.totalBytes
    ? Math.round(
        ((runtime.value.totalBytes - runtime.value.usableBytes) /
          runtime.value.totalBytes) *
          100,
      )
    : 0,
);
function formatBytes(value?: number) {
  if (value === undefined) return '-';
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
async function refresh() {
  refreshing.value = true;
  auditLoading.value = true;
  try {
    const [runtimeStatus, auditPage] = await Promise.all([
      getEmbeddedRuntimeStatus(),
      getKnowledgeAudits({
        pageNum: auditPagination.page,
        pageSize: auditPagination.pageSize,
        spaceId: activeSpace.value?.id,
      }),
    ]);
    runtime.value = runtimeStatus;
    audits.value = auditPage.items;
    auditTotal.value = auditPage.total;
  } finally {
    refreshing.value = false;
    auditLoading.value = false;
  }
}
function requestBackup() {
  dialog.warning({
    title: '创建平台完整备份',
    content:
      '备份会包含数据库及知识平台相关文件，执行期间会产生磁盘和 IO 开销。确认现在创建吗？',
    negativeText: '取消',
    positiveText: '开始备份',
    onPositiveClick: async () => {
      backingUp.value = true;
      verifyResult.value = undefined;
      try {
        backup.value = await createEmbeddedBackup();
        message.success('备份已生成');
      } finally {
        backingUp.value = false;
      }
    },
  });
}
async function verify() {
  if (!backup.value) return;
  verifying.value = true;
  try {
    verifyResult.value = await checkEmbeddedBackup(backup.value.fileName);
    verifyResult.value.valid
      ? message.success(`校验通过，共 ${verifyResult.value.entries} 条记录`)
      : message.error('备份校验未通过，请查看错误信息');
  } finally {
    verifying.value = false;
  }
}
onMounted(async () => {
  await store.loadSpaces();
  await refresh();
});
</script>

<template>
  <Page title="系统运维" description="查看平台运行安全状态并执行全局备份校验。">
    <KnowledgeSpaceHeader :loading="refreshing" @refresh="refresh" />
    <div class="grid gap-4 lg:grid-cols-2">
      <NCard title="系统运行状态" :bordered="false">
        <NAlert
          :type="runtime?.singleWriter ? 'success' : 'warning'"
          :bordered="false"
        >
          {{
            runtime?.singleWriter
              ? '单写实例锁已启用，当前运行模式正常'
              : '实例锁状态待确认，请避免同时启动多个写入实例'
          }}
        </NAlert>
        <NDescriptions
          v-if="runtime"
          class="mt-4"
          bordered
          label-placement="left"
          :column="1"
        >
          <NDescriptionsItem label="数据目录"
            ><span class="break-all">{{
              runtime.dataRoot
            }}</span></NDescriptionsItem
          >
          <NDescriptionsItem label="数据库"
            ><span class="break-all">{{
              runtime.database
            }}</span></NDescriptionsItem
          >
          <NDescriptionsItem label="磁盘总量">{{
            formatBytes(runtime.totalBytes)
          }}</NDescriptionsItem>
          <NDescriptionsItem label="可用空间">{{
            formatBytes(runtime.usableBytes)
          }}</NDescriptionsItem>
        </NDescriptions>
        <div v-if="runtime" class="mt-4">
          <div class="mb-2 flex justify-between text-sm">
            <span>磁盘使用率</span><span>{{ diskPercent }}%</span>
          </div>
          <NProgress
            :percentage="diskPercent"
            :status="
              diskPercent > 90
                ? 'error'
                : diskPercent > 75
                  ? 'warning'
                  : 'success'
            "
          />
        </div>
        <NButton class="mt-5" :loading="refreshing" @click="refresh"
          >刷新系统状态</NButton
        >
      </NCard>

      <NCard title="备份与恢复校验" :bordered="false">
        <div class="text-sm leading-6 text-muted-foreground">
          完整备份包含数据库、上传文件、模型和索引目录。恢复前应在停机窗口中先执行完整性校验。
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <NButton type="primary" :loading="backingUp" @click="requestBackup"
            >立即创建备份</NButton
          >
          <NButton :disabled="!backup" :loading="verifying" @click="verify"
            >校验本次备份</NButton
          >
        </div>
        <div v-if="backup" class="mt-5 rounded-lg border p-4 text-sm">
          <div class="flex flex-wrap items-center gap-2">
            <NTag type="success">备份已生成</NTag>
            <span>{{ (backup.size / 1024 / 1024).toFixed(2) }} MB</span>
          </div>
          <div class="mt-3 break-all text-muted-foreground">
            {{ backup.fileName }}
          </div>
          <div class="mt-2 text-xs text-muted-foreground">
            创建于 {{ new Date(backup.createdAt).toLocaleString() }}
          </div>
        </div>
        <NAlert
          v-if="verifyResult"
          class="mt-4"
          :type="verifyResult.valid ? 'success' : 'error'"
          :title="verifyResult.valid ? '备份校验通过' : '备份校验失败'"
        >
          <template v-if="verifyResult.valid"
            >共检查 {{ verifyResult.entries }} 条记录。</template
          >
          <ul v-else class="list-disc pl-5">
            <li v-for="error in verifyResult.errors" :key="error">
              {{ error }}
            </li>
          </ul>
        </NAlert>
      </NCard>
    </div>

    <NCard class="mt-4" title="当前空间配置（仅供参考）" :bordered="false">
      <div v-if="activeSpace" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <div class="text-sm text-muted-foreground">空间</div>
          <div class="mt-1 font-medium">{{ activeSpace.name }}</div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">索引版本</div>
          <div class="mt-1 font-medium">
            v{{ activeSpace.activeIndexVersion }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">向量模型</div>
          <div class="mt-1 break-all font-medium">
            {{ activeSpace.embeddingProfile || '-' }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">重排模型</div>
          <div class="mt-1 break-all font-medium">
            {{ activeSpace.rerankProfile || '-' }}
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">访问范围</div>
          <div class="mt-1">
            <KnowledgeStatusTag :value="activeSpace.accessMode" />
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">审核策略</div>
          <div class="mt-1">
            <KnowledgeStatusTag :value="activeSpace.reviewMode" />
          </div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">分块大小</div>
          <div class="mt-1 font-medium">{{ activeSpace.chunkSize }}</div>
        </div>
        <div>
          <div class="text-sm text-muted-foreground">重叠长度</div>
          <div class="mt-1 font-medium">{{ activeSpace.chunkOverlap }}</div>
        </div>
      </div>
      <NAlert v-else type="info" :bordered="false"
        >选择知识空间后可查看空间级配置。系统备份操作始终影响整个知识平台。</NAlert
      >
    </NCard>
    <NCard class="mt-4" title="操作审计" :bordered="false">
      <NDataTable
        remote
        :columns="auditColumns"
        :data="audits"
        :loading="auditLoading"
        :pagination="{
          page: auditPagination.page,
          pageSize: auditPagination.pageSize,
          itemCount: auditTotal,
          showSizePicker: true,
          pageSizes: [10, 20, 50],
          onChange: (page: number) => {
            auditPagination.page = page;
            refresh();
          },
          onUpdatePageSize: (size: number) => {
            auditPagination.pageSize = size;
            auditPagination.page = 1;
            refresh();
          },
        }"
      />
    </NCard>
  </Page>
</template>
