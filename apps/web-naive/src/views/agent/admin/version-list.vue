<script lang="ts" setup>
import type { AgentVersionApi } from '#/api/agent/version';

import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { NButton, NDataTable, NEmpty, NPopconfirm, NSpace, NSpin, NTag } from 'naive-ui';

import {
  activateVersion,
  archiveVersion,
  deleteVersion,
  getVersionList,
  publishVersion,
} from '#/api/agent/version';

import VersionForm from './version-form.vue';

const route = useRoute();
const router = useRouter();

const agentId = ref((route.query.agentId as string) || '');
const agentName = ref((route.query.agentName as string) || '');

watch(
  () => route.query,
  (q) => {
    agentId.value = (q.agentId as string) || '';
    agentName.value = (q.agentName as string) || '';
    loadVersions();
  },
);

const hasAgent = computed(() => !!agentId.value);

const loading = ref(false);
const versionList = ref<AgentVersionApi.AgentVersionVO[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: VersionForm,
  destroyOnClose: true,
});

const columns = [
  { key: 'versionNumber', title: '版本号', width: 140 },
  { key: 'description', title: '描述', ellipsis: { tooltip: true } },
  {
    key: 'status',
    title: '状态',
    width: 110,
    render(row: AgentVersionApi.AgentVersionVO) {
      const map: Record<string, { color: string; label: string }> = {
        DRAFT: { color: 'default', label: '草稿' },
        PUBLISHED: { color: 'success', label: '已发布' },
        ARCHIVED: { color: 'warning', label: '已归档' },
      };
      const info = map[row.status] || { color: 'default', label: row.status };
      return h(NTag, { bordered: false, type: info.color as any }, () => info.label);
    },
  },
  { key: 'createTime', title: '创建时间', width: 170 },
  {
    key: 'actions',
    title: '操作',
    width: 320,
    render(row: AgentVersionApi.AgentVersionVO) {
      return h(NSpace, () => [
        row.status === 'DRAFT' &&
          h(NPopconfirm, { onPositiveClick: () => handlePublish(row) }, {
            default: () => '确认发布该版本？',
            trigger: () => h(NButton, { size: 'small', type: 'primary' }, () => '发布'),
          }),
        row.status === 'PUBLISHED' &&
          h(NPopconfirm, { onPositiveClick: () => handleArchive(row) }, {
            default: () => '确认归档该版本？',
            trigger: () => h(NButton, { size: 'small' }, () => '归档'),
          }),
        row.status === 'PUBLISHED' &&
          h(NPopconfirm, { onPositiveClick: () => handleActivate(row) }, {
            default: () => '确认激活该版本为当前版本？',
            trigger: () => h(NButton, { size: 'small', type: 'success' }, () => '激活'),
          }),
        h(NButton, { size: 'small', onClick: () => handleEditGraph(row) }, () => '编排'),
        h(NButton, { size: 'small', onClick: () => handleCopy(row) }, () => '复制'),
        h(NButton, { size: 'small', onClick: () => handleEdit(row) }, () => '编辑'),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
          default: () => '确认删除该版本？',
          trigger: () => h(NButton, { size: 'small', type: 'error' }, () => '删除'),
        }),
      ].filter(Boolean));
    },
  },
];

async function loadVersions() {
  if (!agentId.value) return;
  loading.value = true;
  try {
    versionList.value = (await getVersionList(agentId.value)) || [];
  } finally {
    loading.value = false;
  }
}

async function handlePublish(row: AgentVersionApi.AgentVersionVO) {
  await publishVersion(agentId.value, row.id);
  loadVersions();
}

async function handleArchive(row: AgentVersionApi.AgentVersionVO) {
  await archiveVersion(agentId.value, row.id);
  loadVersions();
}

async function handleActivate(row: AgentVersionApi.AgentVersionVO) {
  await activateVersion(agentId.value, row.id);
  loadVersions();
}

function handleEdit(row: AgentVersionApi.AgentVersionVO) {
  formModalApi.setData({ agentId: agentId.value, isEdit: true, editData: row }).open();
}

function handleCopy(row: AgentVersionApi.AgentVersionVO) {
  formModalApi.setData({ agentId: agentId.value, isCopy: true, editData: row }).open();
}

function handleEditGraph(row: AgentVersionApi.AgentVersionVO) {
  router.push({
    path: '/agent/admin/graph',
    query: { agentId: agentId.value, versionId: String(row.id), agentName: agentName.value },
  });
}

async function handleDelete(row: AgentVersionApi.AgentVersionVO) {
  await deleteVersion(agentId.value, row.id);
  loadVersions();
}

function onCreate() {
  formModalApi.setData({ agentId: agentId.value }).open();
}

function onBack() {
  router.push({ path: '/agent/admin/list' });
}

onMounted(loadVersions);
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="loadVersions" />
    <NSpace vertical :size="16">
      <NSpace align="center">
        <NButton @click="onBack">返回</NButton>
        <span class="text-lg font-semibold">{{ agentName || '版本管理' }}</span>
      </NSpace>
      <NEmpty v-if="!hasAgent" description="请从 Agent 管理页面进入版本管理" />
      <template v-else>
        <NSpace>
          <NButton type="primary" @click="onCreate">新建版本</NButton>
        </NSpace>
        <NSpin :show="loading">
          <NDataTable
            :columns="columns"
            :data="versionList"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
      </template>
    </NSpace>
  </Page>
</template>
