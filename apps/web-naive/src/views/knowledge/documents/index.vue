<script setup lang="ts">
import type { DataTableColumns, UploadCustomRequestOptions } from 'naive-ui';

import type { DocumentVersion } from '#/api/knowledge/document';
import type { KnowledgeDocument } from '#/api/knowledge/enterprise';

import { h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  NUpload,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { dialog } from '#/adapter/naive';
import {
  getDocumentVersions,
  getKnowledgeDocumentRelations,
  getKnowledgePointIdsByDocument,
  previewDocument,
  replaceKnowledgeDocumentPoints,
  replaceKnowledgeDocumentRelations,
  rollbackDocument,
} from '#/api/knowledge/document';
import {
  deleteDocument,
  getDocuments,
  importDocumentFromUrl,
  transitionDocument,
  uploadDocument,
} from '#/api/knowledge/enterprise';
import { getKnowledgePoint, getKnowledgePoints } from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';
import KnowledgeStatusTag from '../components/knowledge-status-tag.vue';
import { lifecycleStatusOptions } from '../constants/status';

const message = useMessage();
const router = useRouter();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const rows = ref<KnowledgeDocument[]>([]);
const total = ref(0);
const keyword = ref('');
const lifecycleStatus = ref<string>();
const loading = ref(false);
const uploading = ref(false);
const drawer = ref(false);
const versions = ref<DocumentVersion[]>([]);
const selected = ref<KnowledgeDocument>();
const selectedPointIds = ref<number[]>([]);
const relationType = ref('RELATED');
const pointOptions = ref<Array<{ label: string; value: number }>>([]);
const pointOptionsLoading = ref(false);
const relationSaving = ref(false);
const documentRelations = ref<
  Array<{ documentId: number; relationType: string }>
>([]);
const documentOptions = ref<Array<{ label: string; value: number }>>([]);
const urlImportVisible = ref(false);
const urlImporting = ref(false);
const importUrl = ref('');
const importTitle = ref('');
const pagination = reactive({ page: 1, pageSize: 10 });
const uploadRef = ref<InstanceType<typeof NUpload>>();
const documentTypeLabels: Record<string, string> = {
  ARTICLE: '文章',
  MANUAL: '手册',
  POLICY: '制度',
  REFERENCE: '参考资料',
};

async function load() {
  if (!activeSpaceId.value) {
    rows.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await getDocuments(activeSpaceId.value, {
      keyword: keyword.value.trim() || undefined,
      lifecycleStatus: lifecycleStatus.value,
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
    });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}
function search() {
  pagination.page = 1;
  load();
}
async function upload({
  file,
  onError,
  onFinish,
  onProgress,
}: UploadCustomRequestOptions) {
  if (!activeSpaceId.value || !file.file) return;
  uploading.value = true;
  onProgress({ percent: 0 });
  try {
    const result = await uploadDocument(
      activeSpaceId.value,
      file.file,
      (percent) => {
        onProgress({ percent });
      },
    );
    onProgress({ percent: 100 });
    onFinish();
    if (result.duplicate) message.warning('检测到重复文件，已复用已有内容');
    else if (result.jobId)
      message.success(`文档已加入处理队列，任务 #${result.jobId}`);
    else message.success('文档上传成功');
    await load();
  } catch {
    onError();
  } finally {
    uploading.value = false;
  }
}
async function action(
  row: KnowledgeDocument,
  actionName: 'approve' | 'archive' | 'publish' | 'reject' | 'submit',
) {
  await transitionDocument(row.id, actionName);
  message.success('文档状态已更新');
  await load();
}
async function showDetail(row: KnowledgeDocument) {
  const spaceId = activeSpaceId.value;
  if (!spaceId) return;
  selected.value = row;
  drawer.value = true;
  const [documentVersions, pointIds, relations] = await Promise.all([
    getDocumentVersions(row.id),
    getKnowledgePointIdsByDocument(row.id),
    getKnowledgeDocumentRelations(row.id),
  ]);
  versions.value = documentVersions;
  selectedPointIds.value = pointIds;
  documentRelations.value = relations.map((item) => ({
    documentId: item.targetDocumentId,
    relationType: item.relationType,
  }));
  const documentPage = await getDocuments(spaceId, {
    pageNum: 1,
    pageSize: 100,
  });
  documentOptions.value = documentPage.items
    .filter((item) => item.id !== row.id)
    .map((item) => ({ label: item.title, value: item.id }));
  await searchPointOptions('');
}
async function searchPointOptions(keyword: string) {
  if (!activeSpaceId.value) return;
  pointOptionsLoading.value = true;
  try {
    const result = await getKnowledgePoints(activeSpaceId.value, {
      keyword: keyword.trim() || undefined,
      pageNum: 1,
      pageSize: 50,
    });
    const options = result.items.map((point) => ({
      label: `[${point.code}] ${point.name}`,
      value: point.id,
    }));
    const missingIds = selectedPointIds.value.filter(
      (id) => !options.some((option) => option.value === id),
    );
    if (missingIds.length > 0) {
      const missing = await Promise.all(
        missingIds.map((id) => getKnowledgePoint(id)),
      );
      options.push(
        ...missing.map((point) => ({
          label: `[${point.code}] ${point.name}`,
          value: point.id,
        })),
      );
    }
    pointOptions.value = options;
  } finally {
    pointOptionsLoading.value = false;
  }
}
async function savePointRelations() {
  if (!selected.value) return;
  relationSaving.value = true;
  try {
    await replaceKnowledgeDocumentPoints(
      selected.value.id,
      selectedPointIds.value,
      relationType.value,
    );
    message.success('文档关联知识点已更新');
  } finally {
    relationSaving.value = false;
  }
}

async function saveDocumentRelations() {
  if (!selected.value) return;
  relationSaving.value = true;
  try {
    await replaceKnowledgeDocumentRelations(
      selected.value.id,
      documentRelations.value,
    );
    message.success('document relation updated');
  } finally {
    relationSaving.value = false;
  }
}

function updateDocumentSelection(ids: number[]) {
  documentRelations.value = ids.map((id) => ({
    documentId: id,
    relationType:
      documentRelations.value.find((item) => item.documentId === id)
        ?.relationType || 'RELATED_TO',
  }));
}
async function importFromUrl() {
  if (!activeSpaceId.value || !importUrl.value.trim()) {
    message.warning('请输入要导入的 URL');
    return;
  }
  urlImporting.value = true;
  try {
    const result = await importDocumentFromUrl(
      activeSpaceId.value,
      importUrl.value.trim(),
      importTitle.value.trim() || undefined,
    );
    message.success(
      result.duplicate
        ? '检测到重复网页，已复用已有文档'
        : '网页已加入处理队列',
    );
    urlImportVisible.value = false;
    importUrl.value = '';
    importTitle.value = '';
    await load();
  } finally {
    urlImporting.value = false;
  }
}
async function rollback(versionId: number) {
  const document = selected.value;
  if (!document) return;
  dialog.warning({
    title: '回滚文档版本',
    content: '回滚后会生成新的当前版本，并重新触发相关处理流程，是否继续？',
    negativeText: '取消',
    positiveText: '确认回滚',
    onPositiveClick: async () => {
      await rollbackDocument(document.id, versionId);
      message.success('已回滚到指定版本');
      await Promise.all([load(), showDetail(document)]);
    },
  });
}
async function preview(row: KnowledgeDocument) {
  const blob = await previewDocument(row.id);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
function remove(row: KnowledgeDocument) {
  dialog.warning({
    title: '删除文档',
    content: `确认删除“${row.title}”吗？该文档的版本和索引内容也会被移除。`,
    negativeText: '取消',
    positiveText: '删除',
    onPositiveClick: async () => {
      await deleteDocument(row.id);
      message.success('文档已删除');
      await load();
    },
  });
}
const columns: DataTableColumns<KnowledgeDocument> = [
  {
    key: 'title',
    minWidth: 260,
    title: '文档',
    render: (row) =>
      h('div', [
        h(
          'button',
          { class: 'font-medium text-primary', onClick: () => showDetail(row) },
          row.title,
        ),
        h(
          'div',
          { class: 'mt-1 text-xs text-muted-foreground' },
          `${documentTypeLabels[row.docType] || row.docType} · ${(row.fileSize / 1024).toFixed(1)} KB`,
        ),
      ]),
  },
  {
    key: 'parseStatus',
    title: '解析状态',
    width: 110,
    render: (row) => h(KnowledgeStatusTag, { value: row.parseStatus }),
  },
  {
    key: 'lifecycleStatus',
    title: '生命周期',
    width: 110,
    render: (row) => h(KnowledgeStatusTag, { value: row.lifecycleStatus }),
  },
  {
    key: 'updateTime',
    title: '更新时间',
    width: 180,
    render: (row) => new Date(row.updateTime).toLocaleString(),
  },
  {
    key: 'actions',
    title: '操作',
    width: 290,
    render: (row) =>
      h(
        NSpace,
        { size: 6 },
        {
          default: () =>
            [
              h(
                NButton,
                { size: 'small', onClick: () => showDetail(row) },
                { default: () => '详情' },
              ),
              row.lifecycleStatus === 'DRAFT' &&
                h(
                  NButton,
                  { size: 'small', onClick: () => action(row, 'submit') },
                  { default: () => '提交审核' },
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
                  { size: 'small', onClick: () => action(row, 'reject') },
                  { default: () => '驳回' },
                ),
              row.lifecycleStatus !== 'PUBLISHED' &&
                row.parseStatus === 'READY' &&
                h(
                  NButton,
                  { size: 'small', onClick: () => action(row, 'publish') },
                  { default: () => '发布' },
                ),
              row.lifecycleStatus === 'PUBLISHED' &&
                h(
                  NButton,
                  { size: 'small', onClick: () => action(row, 'archive') },
                  { default: () => '归档' },
                ),
              h(
                NButton,
                { size: 'small', type: 'error', onClick: () => remove(row) },
                { default: () => '删除' },
              ),
            ].filter(Boolean),
        },
      ),
  },
];
onMounted(async () => {
  await store.loadSpaces();
  await load();
});
</script>

<template>
  <Page
    title="文档中心"
    description="集中完成文档导入、解析、审核、发布和版本管理。"
  >
    <KnowledgeSpaceHeader
      :loading="loading"
      show-import
      @refresh="load"
      @import="uploadRef?.openOpenFileDialog()"
    />
    <NCard :bordered="false">
      <div class="flex flex-wrap justify-between gap-3">
        <div class="flex flex-wrap gap-2">
          <NInput
            v-model:value="keyword"
            clearable
            class="w-72"
            placeholder="搜索文档标题"
            @keyup.enter="search"
          />
          <NSelect
            v-model:value="lifecycleStatus"
            clearable
            class="w-36"
            placeholder="生命周期"
            :options="lifecycleStatusOptions"
            @update:value="search"
          />
          <NButton @click="search">查询</NButton>
        </div>
        <div class="flex gap-2">
          <NButton @click="router.push('/knowledge-center/spaces')">
            查看处理任务
          </NButton>
          <NButton :disabled="!activeSpaceId" @click="urlImportVisible = true">
            导入网页 URL
          </NButton>
          <NUpload
            ref="uploadRef"
            :custom-request="upload"
            :show-file-list="false"
            multiple
          >
            <NButton
              type="primary"
              :loading="uploading"
              :disabled="!activeSpaceId"
            >
              选择文件导入
            </NButton>
          </NUpload>
        </div>
      </div>
      <NDataTable
        v-if="rows.length || loading"
        class="mt-5"
        remote
        :bordered="false"
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="{
          page: pagination.page,
          pageSize: pagination.pageSize,
          itemCount: total,
          showSizePicker: true,
          pageSizes: [10, 20, 50],
          onChange: (page: number) => {
            pagination.page = page;
            load();
          },
          onUpdatePageSize: (size: number) => {
            pagination.pageSize = size;
            pagination.page = 1;
            load();
          },
        }"
      />
      <KnowledgeEmptyState
        v-else
        :description="
          activeSpaceId ? '当前空间暂无文档' : '请先选择或创建知识空间'
        "
        :action-text="activeSpaceId ? '导入第一份文档' : undefined"
        @action="uploadRef?.openOpenFileDialog()"
      />
    </NCard>

    <NModal
      v-model:show="urlImportVisible"
      preset="card"
      title="导入网页 URL"
      style="width: min(560px, 94vw)"
    >
      <div class="space-y-4">
        <NInput
          v-model:value="importUrl"
          placeholder="https://example.com/policy.html"
        />
        <NInput
          v-model:value="importTitle"
          placeholder="可选：自定义文档标题"
        />
        <div class="text-xs text-muted-foreground">
          仅允许访问公开的 HTTP/HTTPS 地址，单个网页最大 200 MB。
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="urlImportVisible = false">取消</NButton>
          <NButton
            type="primary"
            :loading="urlImporting"
            @click="importFromUrl"
          >
            开始导入
          </NButton>
        </div>
      </template>
    </NModal>

    <NDrawer v-model:show="drawer" :width="620">
      <NDrawerContent title="文档详情" closable>
        <template v-if="selected">
          <div class="mb-4">
            <div class="text-lg font-semibold">{{ selected.title }}</div>
            <div class="mt-2 flex gap-2">
              <KnowledgeStatusTag
                :value="selected.parseStatus"
              /><KnowledgeStatusTag :value="selected.lifecycleStatus" />
            </div>
          </div>
          <NTabs>
            <NTabPane name="info" tab="基本信息">
              <div class="grid gap-3 text-sm">
                <div>
                  <span class="text-muted-foreground">来源：</span
                  >{{ selected.source || '-' }}
                </div>
                <div>
                  <span class="text-muted-foreground">类型：</span
                  >{{ selected.mimeType }}
                </div>
                <div>
                  <span class="text-muted-foreground">存储位置：</span
                  ><span class="break-all">{{ selected.objectKey }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">校验值：</span
                  ><span class="break-all">{{ selected.checksum }}</span>
                </div>
                <NButton class="mt-2" @click="preview(selected)">
                  预览文档
                </NButton>
              </div>
            </NTabPane>
            <NTabPane name="versions" tab="版本历史">
              <div v-if="versions.length" class="divide-y">
                <div
                  v-for="version in versions"
                  :key="version.id"
                  class="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <b>v{{ version.versionNo }} · {{ version.title }}</b>
                    <div class="mt-1 flex gap-2">
                      <NTag size="small">{{ version.mimeType }}</NTag
                      ><KnowledgeStatusTag :value="version.parseStatus" />
                    </div>
                  </div>
                  <NButton size="small" @click="rollback(version.id)">
                    回滚到此版本
                  </NButton>
                </div>
              </div>
              <KnowledgeEmptyState v-else description="暂无版本记录" />
            </NTabPane>
            <NTabPane name="points" tab="关联知识点">
              <div class="space-y-3">
                <NSelect
                  v-model:value="selectedPointIds"
                  multiple
                  filterable
                  remote
                  clearable
                  :options="pointOptions"
                  :loading="pointOptionsLoading"
                  placeholder="搜索并选择当前空间的知识点"
                  @search="searchPointOptions"
                />
                <NSelect
                  v-model:value="relationType"
                  :options="[
                    { label: '相关资料', value: 'RELATED' },
                    { label: '来源文档', value: 'SOURCE' },
                    { label: '支持说明', value: 'SUPPORTS' },
                    { label: '主要来源', value: 'PRIMARY_SOURCE' },
                    { label: '参考资料', value: 'REFERENCE' },
                  ]"
                  placeholder="选择关联语义"
                />
                <div class="text-xs text-muted-foreground">
                  关联是可选的，不影响文档解析、发布和检索；用于来源追溯和知识图谱导航。
                </div>
                <NButton
                  type="primary"
                  :loading="relationSaving"
                  @click="savePointRelations"
                >
                  保存关联
                </NButton>
              </div>
            </NTabPane>
            <NTabPane name="documents" tab="文档关联">
              <div class="space-y-3">
                <div
                  v-for="relation in documentRelations"
                  :key="relation.documentId"
                  class="flex items-center gap-2"
                >
                  <NTag class="max-w-48 truncate">
                    {{
                      documentOptions.find(
                        (item) => item.value === relation.documentId,
                      )?.label || relation.documentId
                    }}
                  </NTag>
                  <NSelect
                    v-model:value="relation.relationType"
                    class="flex-1"
                    :options="[
                      { label: '引用', value: 'REFERENCES' },
                      { label: '替代', value: 'SUPERSEDES' },
                      { label: '派生', value: 'DERIVED_FROM' },
                      { label: '翻译', value: 'TRANSLATION_OF' },
                      { label: '重复', value: 'DUPLICATE_OF' },
                      { label: '相关', value: 'RELATED_TO' },
                    ]"
                  />
                </div>
                <NSelect
                  multiple
                  :value="documentRelations.map((item) => item.documentId)"
                  :options="documentOptions"
                  placeholder="选择关联文档"
                  @update:value="updateDocumentSelection"
                />
                <NButton
                  type="primary"
                  :loading="relationSaving"
                  @click="saveDocumentRelations"
                >
                  保存文档关联
                </NButton>
              </div>
            </NTabPane>
          </NTabs>
        </template>
      </NDrawerContent>
    </NDrawer>
  </Page>
</template>
