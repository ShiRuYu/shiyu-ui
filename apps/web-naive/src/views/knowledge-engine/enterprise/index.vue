<script lang="ts" setup>
import type { UploadCustomRequestOptions } from 'naive-ui';

import type {
  BackupResult,
  EmbeddedRuntimeStatus,
  HybridHit,
  IngestionJob,
  KnowledgeDocument,
} from '#/api/knowledge/enterprise';

import { computed, h, onMounted, reactive, ref } from 'vue';

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
  NPopconfirm,
  NProgress,
  NSelect,
  NSpace,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NUpload,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { message } from '#/adapter/naive';
import {
  cancelJob,
  checkEmbeddedBackup,
  createEmbeddedBackup,
  createSpace,
  getDocuments,
  getEmbeddedRuntimeStatus,
  getJobs,
  hybridSearch,
  rebuildSpaceIndex,
  retryJob,
  transitionDocument,
  uploadDocument,
} from '#/api/knowledge/enterprise';
import {
  createKnowledgePoint,
  deleteKnowledgePoint,
  getKnowledgePoints,
  type KnowledgePoint as KnowledgePointView,
  updateKnowledgePoint,
} from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

const knowledgeStore = useKnowledgeStore();
const { activeSpaceId, spaceOptions, spaces } = storeToRefs(knowledgeStore);
const documents = ref<KnowledgeDocument[]>([]);
const points = ref<KnowledgePointView[]>([]);
const jobs = ref<IngestionJob[]>([]);
const hits = ref<HybridHit[]>([]);
const loading = ref(false);
const pointLoading = ref(false);
const spaceModal = ref(false);
const pointModal = ref(false);
const editingPointId = ref<number>();
const query = ref('');
const pointKeyword = ref('');
const topK = ref(5);
const runtimeStatus = ref<EmbeddedRuntimeStatus>();
const latestBackup = ref<BackupResult>();
const spaceForm = ref({
  code: '',
  difficultyScaleId: 1,
  name: '',
  reviewMode: 'OPTIONAL',
});
const pointForm = reactive({
  category: '',
  code: '',
  description: '',
  difficultyLevel: 1,
  name: '',
  tags: '',
});
const difficultyOptions = computed(
  () =>
    knowledgeStore.difficultyScale?.levels.map((level) => ({
      label: `${level.level} · ${level.label}`,
      value: level.level,
    })) ?? [{ label: '1', value: 1 }],
);
const failedJobs = computed(
  () => jobs.value.filter((item) => item.status === 'FAILED').length,
);

async function loadSpaces() {
  await knowledgeStore.loadSpaces();
}

async function loadPoints() {
  if (!activeSpaceId.value) return;
  pointLoading.value = true;
  try {
    const result = await getKnowledgePoints(activeSpaceId.value, {
      keyword: pointKeyword.value || undefined,
      pageNum: 1,
      pageSize: 20,
    });
    points.value = result.items;
  } finally {
    pointLoading.value = false;
  }
}

async function loadWorkspace() {
  if (!activeSpaceId.value) return;
  await knowledgeStore.loadDifficultyScale(activeSpaceId.value);
  loading.value = true;
  try {
    const [documentPage, jobPage, pointPage] = await Promise.all([
      getDocuments(activeSpaceId.value, { pageNum: 1, pageSize: 20 }),
      getJobs({
        pageNum: 1,
        pageSize: 20,
        spaceId: activeSpaceId.value,
      }),
      getKnowledgePoints(activeSpaceId.value, {
        pageNum: 1,
        pageSize: 20,
        keyword: pointKeyword.value || undefined,
      }),
    ]);
    documents.value = documentPage.items;
    jobs.value = jobPage.items;
    points.value = pointPage.items;
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

async function submitPoint() {
  if (!activeSpaceId.value) return;
  if (editingPointId.value) {
    await updateKnowledgePoint(editingPointId.value, pointForm);
    message.success('知识点已更新');
  } else {
    await createKnowledgePoint(activeSpaceId.value, pointForm);
    message.success('知识点已创建');
  }
  pointModal.value = false;
  editingPointId.value = undefined;
  Object.assign(pointForm, {
    category: '',
    code: '',
    description: '',
    difficultyLevel: 1,
    name: '',
    tags: '',
  });
  await loadPoints();
}

function editPoint(point: KnowledgePointView) {
  editingPointId.value = point.id;
  Object.assign(pointForm, {
    category: point.category ?? '',
    code: point.code,
    description: point.description ?? '',
    difficultyLevel: point.difficultyLevel ?? 1,
    name: point.name,
    tags: point.tags ?? '',
  });
  pointModal.value = true;
}

async function removePoint(point: KnowledgePointView) {
  await deleteKnowledgePoint(point.id);
  message.success('知识点已删除');
  await loadPoints();
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

const pointColumns = [
  { key: 'code', title: '编码', width: 140 },
  { key: 'name', title: '知识点', minWidth: 180 },
  { key: 'category', title: '分类', width: 120 },
  { key: 'difficultyLevel', title: '难度', width: 80 },
  { key: 'tags', title: '标签', minWidth: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    render: (row: KnowledgePointView) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              { size: 'small', onClick: () => editPoint(row) },
              { default: () => '编辑' },
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => removePoint(row) },
              {
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', type: 'error' },
                    { default: () => '删除' },
                  ),
                default: () => '确认删除该知识点？关联关系和文档关联也会清理。',
              },
            ),
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
        <NGridItem>
          <NCard><NStatistic label="知识空间" :value="spaces.length" /></NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="当前文档" :value="documents.length" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard><NStatistic label="运行任务" :value="jobs.length" /></NCard>
        </NGridItem>
        <NGridItem>
          <NCard><NStatistic label="失败任务" :value="failedJobs" /></NCard>
        </NGridItem>
      </NGrid>

      <NCard>
        <NSpace align="center">
          <NSelect
            v-model:value="activeSpaceId"
            :options="spaceOptions"
            style="width: 260px"
            @update:value="
              (value) => {
                knowledgeStore.setActiveSpace(value);
                loadWorkspace();
              }
            "
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
        <NTabPane name="points" tab="知识点">
          <NCard>
            <NSpace align="center">
              <NInput
                v-model:value="pointKeyword"
                clearable
                placeholder="搜索编码或名称"
                style="width: 280px"
                @keyup.enter="loadPoints"
              />
              <NButton @click="loadPoints">搜索</NButton>
              <NButton
                type="primary"
                @click="
                  editingPointId = undefined;
                  pointModal = true;
                "
              >
                新建知识点
              </NButton>
            </NSpace>
            <NDataTable
              class="mt-4"
              :columns="pointColumns"
              :data="points"
              :loading="pointLoading"
            />
          </NCard>
        </NTabPane>
        <NTabPane name="documents" tab="文档中心">
          <NCard>
            <NUpload :custom-request="upload" :show-file-list="false" multiple>
              <NButton type="primary">
                上传 PDF / DOCX / Markdown / TXT / HTML
              </NButton>
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
                <template #header>
                  文档 #{{ hit.documentId }} / Chunk #{{ hit.chunkId }}
                </template>
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
        <NFormItem label="空间编码">
          <NInput v-model:value="spaceForm.code" />
        </NFormItem>
        <NFormItem label="空间名称">
          <NInput v-model:value="spaceForm.name" />
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
        <NFormItem label="难度量表 ID">
          <NInputNumber
            v-model:value="spaceForm.difficultyScaleId"
            :min="1"
            placeholder="默认量表：1"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton type="primary" @click="submitSpace">创建</NButton>
      </template>
    </NModal>

    <NModal
      v-model:show="pointModal"
      preset="card"
      :title="editingPointId ? '编辑知识点' : '新建知识点'"
      style="width: 560px"
    >
      <NForm :model="pointForm">
        <NFormItem label="编码">
          <NInput v-model:value="pointForm.code" :disabled="!!editingPointId" />
        </NFormItem>
        <NFormItem label="名称">
          <NInput v-model:value="pointForm.name" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="pointForm.description" type="textarea" />
        </NFormItem>
        <NFormItem label="难度等级">
          <NSelect
            v-model:value="pointForm.difficultyLevel"
            :options="difficultyOptions"
          />
        </NFormItem>
        <NFormItem label="分类">
          <NInput v-model:value="pointForm.category" />
        </NFormItem>
        <NFormItem label="标签">
          <NInput
            v-model:value="pointForm.tags"
            placeholder="JSON 数组或逗号分隔"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NButton type="primary" @click="submitPoint">创建</NButton>
      </template>
    </NModal>
  </Page>
</template>
