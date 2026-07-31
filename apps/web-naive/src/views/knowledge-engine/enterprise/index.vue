<script lang="ts" setup>
import type { UploadCustomRequestOptions } from 'naive-ui';

import type {
  BackupResult,
  EmbeddedRuntimeStatus,
  HybridHit,
  IngestionJob,
  KnowledgeDocument,
  KnowledgeSpace,
} from '#/api/knowledge/enterprise';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NProgress,
  NSelect,
  NSpace,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NUpload,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  cancelJob,
  checkEmbeddedBackup,
  createEmbeddedBackup,
  createSpace,
  getDocuments,
  getEmbeddedRuntimeStatus,
  getJobs,
  getSpaces,
  hybridSearch,
  rebuildSpaceIndex,
  retryJob,
  transitionDocument,
  uploadDocument,
} from '#/api/knowledge/enterprise';

const spaces = ref<KnowledgeSpace[]>([]);
const documents = ref<KnowledgeDocument[]>([]);
const jobs = ref<IngestionJob[]>([]);
const hits = ref<HybridHit[]>([]);
const activeSpaceId = ref<number>();
const loading = ref(false);
const spaceModal = ref(false);
const query = ref('');
const topK = ref(5);
const runtimeStatus = ref<EmbeddedRuntimeStatus>();
const latestBackup = ref<BackupResult>();
const spaceForm = ref({ code: '', name: '', reviewMode: 'OPTIONAL' });

const spaceOptions = computed(() =>
  spaces.value.map((item) => ({ label: item.name, value: item.id })),
);
const failedJobs = computed(
  () => jobs.value.filter((item) => item.status === 'FAILED').length,
);

async function loadSpaces() {
  const result = await getSpaces({ pageNum: 1, pageSize: 100 });
  spaces.value = result.items;
  activeSpaceId.value ||= result.items[0]?.id;
}

async function loadWorkspace() {
  if (!activeSpaceId.value) return;
  loading.value = true;
  try {
    const [documentPage, jobPage] = await Promise.all([
      getDocuments(activeSpaceId.value, { pageNum: 1, pageSize: 20 }),
      getJobs({
        pageNum: 1,
        pageSize: 20,
        spaceId: activeSpaceId.value,
      }),
    ]);
    documents.value = documentPage.items;
    jobs.value = jobPage.items;
  } finally {
    loading.value = false;
  }
}

async function loadRuntimeStatus() {
  runtimeStatus.value = await getEmbeddedRuntimeStatus();
}

async function backupNow() {
  latestBackup.value = await createEmbeddedBackup();
  message.success(`备份已生成：${latestBackup.value.fileName}`);
}

async function verifyLatestBackup() {
  if (!latestBackup.value) return;
  const result = await checkEmbeddedBackup(latestBackup.value.fileName);
  if (result.valid) {
    message.success(`恢复校验通过，共 ${result.entries} 个条目`);
  } else {
    message.error(result.errors.join('；'));
  }
}

async function submitSpace() {
  await createSpace(spaceForm.value);
  message.success('知识空间已创建');
  spaceModal.value = false;
  await loadSpaces();
}

async function upload({ file }: UploadCustomRequestOptions) {
  if (!activeSpaceId.value || !file.file) return;
  const result = await uploadDocument(activeSpaceId.value, file.file);
  message.success(
    result.duplicate ? '已存在相同文档，未重复导入' : '已进入摄取队列',
  );
  await loadWorkspace();
}

async function transition(
  document: KnowledgeDocument,
  action: 'approve' | 'publish' | 'submit',
) {
  await transitionDocument(document.id, action);
  message.success('状态已更新');
  await loadWorkspace();
}

async function search() {
  if (!activeSpaceId.value || !query.value.trim()) return;
  const result = await hybridSearch({
    query: query.value,
    rerank: true,
    spaceId: activeSpaceId.value,
    topK: topK.value,
  });
  hits.value = result.hits;
}

const documentColumns = [
  { key: 'title', title: '文档' },
  { key: 'docType', title: '类型', width: 80 },
  {
    key: 'parseStatus',
    title: '解析',
    width: 100,
    render: (row: KnowledgeDocument) =>
      h(NTag, {}, { default: () => row.parseStatus }),
  },
  {
    key: 'lifecycleStatus',
    title: '生命周期',
    width: 120,
    render: (row: KnowledgeDocument) =>
      h(
        NTag,
        { type: row.lifecycleStatus === 'PUBLISHED' ? 'success' : 'warning' },
        {
          default: () => row.lifecycleStatus,
        },
      ),
  },
  {
    key: 'actions',
    title: '操作',
    width: 230,
    render: (row: KnowledgeDocument) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            row.lifecycleStatus === 'DRAFT'
              ? h(
                  NButton,
                  { size: 'small', onClick: () => transition(row, 'submit') },
                  { default: () => '提交审核' },
                )
              : null,
            row.lifecycleStatus === 'REVIEWING'
              ? h(
                  NButton,
                  {
                    size: 'small',
                    type: 'primary',
                    onClick: () => transition(row, 'approve'),
                  },
                  { default: () => '通过' },
                )
              : null,
            row.lifecycleStatus !== 'PUBLISHED' && row.parseStatus === 'READY'
              ? h(
                  NButton,
                  { size: 'small', onClick: () => transition(row, 'publish') },
                  { default: () => '发布' },
                )
              : null,
          ],
        },
      ),
  },
];

const jobColumns = [
  { key: 'id', title: '任务', width: 90 },
  { key: 'stage', title: '阶段' },
  {
    key: 'progress',
    title: '进度',
    render: (row: IngestionJob) =>
      h(NProgress, {
        percentage: row.progress,
        status: row.status === 'FAILED' ? 'error' : 'default',
      }),
  },
  { key: 'attempts', title: '重试', width: 80 },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    render: (row: IngestionJob) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            row.status === 'FAILED' || row.status === 'CANCELLED'
              ? h(
                  NButton,
                  {
                    size: 'small',
                    onClick: async () => {
                      await retryJob(row.id);
                      await loadWorkspace();
                    },
                  },
                  { default: () => '重试' },
                )
              : null,
            row.status === 'PENDING' || row.status === 'RUNNING'
              ? h(
                  NButton,
                  {
                    size: 'small',
                    onClick: async () => {
                      await cancelJob(row.id);
                      await loadWorkspace();
                    },
                  },
                  { default: () => '取消' },
                )
              : null,
          ],
        },
      ),
  },
];

onMounted(async () => {
  await loadSpaces();
  await loadWorkspace();
  await loadRuntimeStatus();
});
</script>

<template>
  <Page
    title="企业知识引擎"
    description="嵌入式 H2、Lucene 与 JVector 一体化工作台"
  >
    <NSpace vertical :size="16">
      <NGrid :cols="4" :x-gap="12">
        <NGridItem
          >
<NCard><NStatistic label="知识空间" :value="spaces.length" /></NCard
        >
</NGridItem>
        <NGridItem
          >
<NCard
            >
<NStatistic label="当前文档" :value="documents.length" />
</NCard
        >
</NGridItem>
        <NGridItem
          >
<NCard><NStatistic label="运行任务" :value="jobs.length" /></NCard
        >
</NGridItem>
        <NGridItem
          >
<NCard><NStatistic label="失败任务" :value="failedJobs" /></NCard
        >
</NGridItem>
      </NGrid>

      <NCard>
        <NSpace align="center">
          <NSelect
            v-model:value="activeSpaceId"
            :options="spaceOptions"
            style="width: 260px"
            @update:value="loadWorkspace"
          />
          <NButton type="primary" @click="spaceModal = true">新建空间</NButton>
          <NButton @click="loadWorkspace">刷新</NButton>
          <NButton
            v-if="activeSpaceId"
            @click="
              rebuildSpaceIndex(activeSpaceId).then(() =>
                message.success('索引已切换到新版本'),
              )
            "
          >
            重建索引
          </NButton>
        </NSpace>
      </NCard>

      <NTabs type="line" animated>
        <NTabPane name="documents" tab="文档中心">
          <NCard>
            <NUpload :custom-request="upload" :show-file-list="false" multiple>
              <NButton type="primary"
                >
上传 PDF / DOCX / Markdown / TXT / HTML
</NButton
              >
            </NUpload>
            <NDataTable
              class="mt-4"
              :columns="documentColumns"
              :data="documents"
              :loading="loading"
            />
          </NCard>
        </NTabPane>
        <NTabPane name="search" tab="检索实验室">
          <NCard>
            <NSpace>
              <NInput
                v-model:value="query"
                placeholder="输入检索问题"
                style="width: 520px"
                @keyup.enter="search"
              />
              <NInputNumber v-model:value="topK" :min="1" :max="20" />
              <NButton type="primary" @click="search">混合检索 + 重排</NButton>
            </NSpace>
            <NSpace class="mt-4" vertical>
              <NCard v-for="hit in hits" :key="hit.chunkId" size="small">
                <template #header
                  >
文档 #{{ hit.documentId }} / Chunk #{{
                    hit.chunkId
                  }}
</template
                >
                <div>{{ hit.highlight || hit.content }}</div>
                <template #footer>
                  BM25 {{ hit.bm25Score.toFixed(4) }} · Vector
                  {{ hit.vectorScore.toFixed(4) }} · RRF
                  {{ hit.rrfScore.toFixed(4) }}
                </template>
              </NCard>
            </NSpace>
          </NCard>
        </NTabPane>
        <NTabPane name="tasks" tab="任务中心">
          <NDataTable :columns="jobColumns" :data="jobs" :loading="loading" />
        </NTabPane>
        <NTabPane name="operations" tab="运维中心">
          <NSpace class="mb-4">
            <NButton type="primary" @click="backupNow">立即完整备份</NButton>
            <NButton :disabled="!latestBackup" @click="verifyLatestBackup">
              校验最近备份
            </NButton>
            <NTag :type="runtimeStatus?.singleWriter ? 'success' : 'error'">
              {{
                runtimeStatus?.singleWriter ? '单写实例锁已启用' : '实例锁异常'
              }}
            </NTag>
          </NSpace>
          <NCard title="嵌入式运行状态">
            <p v-if="runtimeStatus">
              数据目录：{{ runtimeStatus.dataRoot }}；可用空间：
              {{ (runtimeStatus.usableBytes / 1024 / 1024 / 1024).toFixed(2) }}
              GB
            </p>
            <p v-if="latestBackup">
              最近备份：{{ latestBackup.fileName }}（{{
                (latestBackup.size / 1024 / 1024).toFixed(2)
              }}
              MB）
            </p>
            <p>存储：H2 File / 本地文件</p>
            <p>检索：Lucene + JVector，按租户与空间物理分目录</p>
            <p>
              活动索引版本：{{
                spaces.find((item) => item.id === activeSpaceId)
                  ?.activeIndexVersion ?? 0
              }}
            </p>
            <p>部署边界：单写实例，索引可由 H2 中的 Chunk 与向量重建</p>
          </NCard>
        </NTabPane>
      </NTabs>
    </NSpace>

    <NModal
      v-model:show="spaceModal"
      preset="card"
      title="新建知识空间"
      style="width: 560px"
    >
      <NForm :model="spaceForm">
        <NFormItem label="空间编码"
          >
<NInput v-model:value="spaceForm.code"
        />
</NFormItem>
        <NFormItem label="空间名称"
          >
<NInput v-model:value="spaceForm.name"
        />
</NFormItem>
        <NFormItem label="发布策略">
          <NSelect
            v-model:value="spaceForm.reviewMode"
            :options="[
              { label: '可选审核', value: 'OPTIONAL' },
              { label: '必须审核', value: 'REQUIRED' },
              { label: '直接发布', value: 'DIRECT' },
            ]"
          />
        </NFormItem>
      </NForm>
      <template #footer
        >
<NButton type="primary" @click="submitSpace">创建</NButton>
</template
      >
    </NModal>
  </Page>
</template>
