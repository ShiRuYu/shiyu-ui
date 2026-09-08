<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type {
  KnowledgeEvaluationCase,
  KnowledgeEvaluationRunResult,
} from '#/features/knowledge/api';

import { h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
  NStatistic,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { dialog } from '#/adapter/naive';
import {
  createKnowledgeEvaluation,
  deleteKnowledgeEvaluation,
  getKnowledgeEvaluations,
  runKnowledgeEvaluation,
} from '#/features/knowledge/api';
import KnowledgeEmptyState from '#/features/knowledge/ui/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '#/features/knowledge/ui/knowledge-space-header.vue';
import { useKnowledgeStore } from '#/store';

const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const rows = ref<KnowledgeEvaluationCase[]>([]);
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const running = ref(false);
const runResult = ref<KnowledgeEvaluationRunResult>();
const loadError = ref('');
// Keep the empty state independent from the last run result card.
const show = ref(false);
const page = reactive({ pageNum: 1, pageSize: 10 });
const formRef = ref<FormInst>();
const form = reactive({ question: '', expectedDocIds: '', expectedAnswer: '' });
let disposed = false;
let latestLoadRequest = 0;
const rules: FormRules = {
  question: {
    required: true,
    message: '请输入评测问题',
    trigger: ['blur', 'input'],
  },
};

async function load() {
  const requestId = ++latestLoadRequest;
  const spaceId = activeSpaceId.value;
  if (!spaceId) {
    rows.value = [];
    total.value = 0;
    loadError.value = '';
    return;
  }
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getKnowledgeEvaluations(
      spaceId,
      page.pageNum,
      page.pageSize,
    );
    if (disposed || requestId !== latestLoadRequest) return;
    rows.value = result.items;
    total.value = result.total;
  } catch {
    if (disposed || requestId !== latestLoadRequest) return;
    loadError.value = '评测用例加载失败，请稍后重试';
  } finally {
    if (!disposed && requestId === latestLoadRequest) {
      loading.value = false;
    }
  }
}
async function runEvaluation() {
  if (!activeSpaceId.value) return;
  running.value = true;
  try {
    runResult.value = await runKnowledgeEvaluation(activeSpaceId.value, 5);
    message.success('评测已完成');
  } catch {
    if (!disposed) message.error('评测运行失败，请稍后重试');
  } finally {
    if (!disposed) running.value = false;
  }
}
function openCreate() {
  Object.assign(form, { question: '', expectedDocIds: '', expectedAnswer: '' });
  show.value = true;
}
async function save() {
  await formRef.value?.validate();
  if (!activeSpaceId.value) return;
  saving.value = true;
  try {
    await createKnowledgeEvaluation({ ...form, spaceId: activeSpaceId.value });
    show.value = false;
    message.success('评测用例已创建');
    await load();
  } catch {
    if (!disposed) message.error('评测用例保存失败，请稍后重试');
  } finally {
    if (!disposed) saving.value = false;
  }
}
function remove(row: KnowledgeEvaluationCase) {
  dialog.warning({
    title: '删除评测用例',
    content: `确认删除“${row.question}”吗？`,
    negativeText: '取消',
    positiveText: '删除',
    onPositiveClick: async () => {
      try {
        await deleteKnowledgeEvaluation(row.id);
        if (disposed) return;
        message.success('评测用例已删除');
        await load();
      } catch {
        if (!disposed) message.error('评测用例删除失败，请稍后重试');
      }
    },
  });
}
const columns: DataTableColumns<KnowledgeEvaluationCase> = [
  {
    key: 'question',
    title: '评测问题',
    minWidth: 320,
    ellipsis: { tooltip: true },
  },
  {
    key: 'expectedDocIds',
    title: '期望引用文档',
    width: 180,
    render: (row) => row.expectedDocIds || '-',
  },
  {
    key: 'expectedAnswer',
    title: '期望答案',
    minWidth: 260,
    ellipsis: { tooltip: true },
    render: (row) => row.expectedAnswer || '-',
  },
  {
    key: 'actions',
    title: '操作',
    width: 100,
    render: (row) =>
      h(
        NButton,
        { size: 'small', type: 'error', onClick: () => remove(row) },
        { default: () => '删除' },
      ),
  },
];
watch(activeSpaceId, () => void load());

onMounted(async () => {
  try {
    await store.loadSpaces();
    if (!disposed) await load();
  } catch {
    if (!disposed) loadError.value = '知识空间加载失败，请稍后重试';
  }
});

onUnmounted(() => {
  disposed = true;
  latestLoadRequest += 1;
});
</script>

<template>
  <Page
    title="评测中心"
    description="维护检索问题、期望引用和答案，作为后续 Recall、MRR 和引用准确率评测集。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="load" />
    <NAlert v-if="loadError" type="warning" :bordered="false">
      {{ loadError }}
    </NAlert>
    <NCard :bordered="false">
      <div class="mb-4 flex justify-end">
        <NSpace>
          <NButton
            :loading="running"
            :disabled="!activeSpaceId || !rows.length"
            @click="runEvaluation"
          >
            运行评测
          </NButton>
          <NButton
            type="primary"
            :disabled="!activeSpaceId"
            @click="openCreate"
          >
            新建评测用例
          </NButton>
        </NSpace>
      </div>
      <NDataTable
        v-if="rows.length || loading"
        remote
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="{
          page: page.pageNum,
          pageSize: page.pageSize,
          itemCount: total,
          showSizePicker: true,
          pageSizes: [10, 20, 50],
          onChange: (value: number) => {
            page.pageNum = value;
            load();
          },
          onUpdatePageSize: (value: number) => {
            page.pageSize = value;
            page.pageNum = 1;
            load();
          },
        }"
      />
      <KnowledgeEmptyState
        v-if="!rows.length && !loading"
        description="当前空间还没有评测用例"
        action-text="新建评测用例"
        @action="openCreate"
      />
      <NCard
        v-if="runResult"
        class="mt-4"
        title="最近一次评测结果"
        :bordered="false"
      >
        <div class="grid gap-4 sm:grid-cols-3">
          <NStatistic
            label="Recall@K"
            :value="`${(runResult.recallAtK * 100).toFixed(1)}%`"
          />
          <NStatistic label="MRR" :value="runResult.mrr.toFixed(3)" />
          <NStatistic
            label="引用命中率"
            :value="`${(runResult.citationAccuracy * 100).toFixed(1)}%`"
          />
        </div>
        <div class="mt-4 text-xs text-muted-foreground">
          共执行 {{ runResult.caseCount }} 个用例，TopK={{ runResult.topK }}
        </div>
      </NCard>
    </NCard>

    <NModal
      v-model:show="show"
      preset="card"
      title="新建评测用例"
      style="width: min(680px, 94vw)"
    >
      <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
        <NFormItem label="评测问题" path="question">
          <NInput v-model:value="form.question" type="textarea" :rows="3" />
        </NFormItem>
        <NFormItem label="期望引用文档 ID">
          <NInput
            v-model:value="form.expectedDocIds"
            placeholder="多个文档 ID 用逗号分隔"
          />
        </NFormItem>
        <NFormItem label="期望答案">
          <NInput
            v-model:value="form.expectedAnswer"
            type="textarea"
            :rows="5"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="show = false">取消</NButton
          ><NButton type="primary" :loading="saving" @click="save">
            保存
          </NButton>
        </div>
      </template>
    </NModal>
  </Page>
</template>
