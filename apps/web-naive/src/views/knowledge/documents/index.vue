<script setup lang="ts">
import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NSelect,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  getDocumentVersions,
  rollbackDocument,
} from '#/api/knowledge/document';
import {
  deleteDocument,
  getDocuments,
  type KnowledgeDocument,
  transitionDocument,
  uploadDocument,
} from '#/api/knowledge/enterprise';
import { useKnowledgeStore } from '#/store';
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(store);
const rows = ref<KnowledgeDocument[]>([]);
const keyword = ref('');
const lifecycleStatus = ref<string>();
const loading = ref(false);
const versions = ref<any[]>([]);
const selected = ref<KnowledgeDocument>();
async function load() {
  if (!activeSpaceId.value) return;
  loading.value = true;
  try {
    rows.value = (
      await getDocuments(activeSpaceId.value, {
        pageNum: 1,
        pageSize: 100,
        keyword: keyword.value || undefined,
        lifecycleStatus: lifecycleStatus.value,
      })
    ).items;
  } finally {
    loading.value = false;
  }
}
async function upload({ file }: any) {
  if (!activeSpaceId.value || !file.file) return;
  await uploadDocument(activeSpaceId.value, file.file);
  message.success('文档已加入处理队列');
  await load();
}
async function action(
  row: KnowledgeDocument,
  actionName: 'approve' | 'publish' | 'reject' | 'submit',
) {
  await transitionDocument(row.id, actionName);
  message.success('文档状态已更新');
  await load();
}
async function showVersions(row: KnowledgeDocument) {
  selected.value = row;
  versions.value = await getDocumentVersions(row.id);
}
async function rollback(versionId: number) {
  if (!selected.value) return;
  await rollbackDocument(selected.value.id, versionId);
  message.success('已回滚到指定版本');
  await load();
}
async function changeSpace(value: number) {
  store.setActiveSpace(value);
  await load();
}
onMounted(async () => {
  await store.loadSpaces();
  await load();
});
const columns = [
  { title: '文档名称', key: 'title', minWidth: 240 },
  { title: '类型', key: 'docType', width: 100 },
  {
    title: '解析',
    key: 'parseStatus',
    width: 100,
    render: (row: KnowledgeDocument) =>
      h(
        NTag,
        {
          type:
            row.parseStatus === 'READY'
              ? 'success'
              : row.parseStatus === 'FAILED'
                ? 'error'
                : 'warning',
        },
        { default: () => row.parseStatus },
      ),
  },
  { title: '生命周期', key: 'lifecycleStatus', width: 110 },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    render: (row: KnowledgeDocument) =>
      h('div', { class: 'flex flex-wrap gap-2' }, [
        h(
          NButton,
          { size: 'small', onClick: () => showVersions(row) },
          { default: () => '版本' },
        ),
        row.lifecycleStatus === 'DRAFT' &&
          h(
            NButton,
            { size: 'small', onClick: () => action(row, 'submit') },
            { default: () => '提交' },
          ),
        row.lifecycleStatus === 'REVIEWING' &&
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => action(row, 'approve'),
            },
            { default: () => '通过' },
          ),
        row.lifecycleStatus === 'REVIEWING' &&
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => action(row, 'reject'),
            },
            { default: () => '驳回' },
          ),
        row.lifecycleStatus !== 'PUBLISHED' &&
          row.parseStatus === 'READY' &&
          h(
            NButton,
            { size: 'small', onClick: () => action(row, 'publish') },
            { default: () => '发布' },
          ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            onClick: () => deleteDocument(row.id).then(load),
          },
          { default: () => '删除' },
        ),
      ]),
  },
];
</script>
<template>
  <Page
    title="文档中心"
    description="负责文档导入、解析、审核、发布、版本回滚和删除，不再把文档功能隐藏在工作台 Tab 中。"
    >
<NCard :bordered="false"
      >
<div class="flex flex-wrap justify-between gap-3">
        <div class="flex flex-wrap gap-3">
          <NSelect
            :value="activeSpaceId"
            :options="spaceOptions"
            class="w-56"
            @update:value="changeSpace"
          /><NInput
            v-model:value="keyword"
            class="w-72"
            placeholder="搜索文档标题"
            @keyup.enter="load"
          /><NSelect
            v-model:value="lifecycleStatus"
            clearable
            class="w-36"
            placeholder="生命周期"
            :options="
              ['DRAFT', 'REVIEWING', 'PUBLISHED', 'ARCHIVED'].map((value) => ({
                label: value,
                value,
              }))
            "
          /><NButton @click="load">查询</NButton>
        </div>
        <NUpload :custom-request="upload" :show-file-list="false"
          >
<NButton type="primary">导入文档</NButton>
</NUpload
        >
      </div>
      <NDataTable
        class="mt-5"
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false" />
</NCard
    ><NCard v-if="selected" title="版本历史" class="mt-4"
      >
<div class="space-y-2">
        <div
          v-for="version in versions"
          :key="version.id"
          class="flex items-center justify-between rounded bg-slate-50 px-4 py-3"
        >
          <span
            >v{{ version.versionNo }} · {{ version.title }} ·
            {{ version.parseStatus }}</span
          ><NButton size="small" @click="rollback(version.id)">回滚</NButton>
        </div>
      </div>
</NCard
    >
</Page
  >
</template>
