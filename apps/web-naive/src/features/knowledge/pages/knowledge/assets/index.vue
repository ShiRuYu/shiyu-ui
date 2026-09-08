<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { KnowledgePoint } from '#/features/knowledge/api';

import { computed, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { dialog } from '#/adapter/naive';
import {
  createKnowledgePoint,
  deleteKnowledgePoint,
  getDocuments,
  getKnowledgeDocument,
  getKnowledgeDocumentsByPoint,
  getKnowledgePoints,
  replaceKnowledgePointDocuments,
  updateKnowledgePoint,
} from '#/features/knowledge/api';
import KnowledgeEmptyState from '#/features/knowledge/ui/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '#/features/knowledge/ui/knowledge-space-header.vue';
import { useKnowledgeStore } from '#/store';

const router = useRouter();
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId, difficultyScale } = storeToRefs(store);
const rows = ref<KnowledgePoint[]>([]);
const total = ref(0);
const keyword = ref('');
const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const showDrawer = ref(false);
const editing = ref<KnowledgePoint>();
const formRef = ref<FormInst>();
const selectedDocumentIds = ref<number[]>([]);
const relationType = ref('RELATED');
const documentOptions = ref<Array<{ label: string; value: number }>>([]);
const documentOptionsLoading = ref(false);
const relationSaving = ref(false);
const pagination = reactive({ page: 1, pageSize: 10 });
let disposed = false;
let latestLoadRequest = 0;
let latestOpenRequest = 0;
let latestDocumentRequest = 0;
const form = reactive({
  category: '',
  code: '',
  description: '',
  difficultyLevel: undefined as number | undefined,
  name: '',
  tags: '',
});
const rules: FormRules = {
  code: {
    required: true,
    message: '请输入知识条目编码',
    trigger: ['blur', 'input'],
  },
  name: {
    required: true,
    message: '请输入知识条目名称',
    trigger: ['blur', 'input'],
  },
};
const difficultyOptions = computed(() =>
  (difficultyScale.value?.levels || []).map((item) => ({
    label: `${item.level} · ${item.label}`,
    value: item.level,
  })),
);
function parseTags(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // 兼容历史逗号分隔格式。
  }
  return value
    .replaceAll(/^\[|\]$/g, '')
    .split(/[,，]/)
    .map((item) => item.replaceAll(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

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
    const result = await getKnowledgePoints(spaceId, {
      keyword: keyword.value.trim() || undefined,
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
    });
    if (disposed || requestId !== latestLoadRequest) return;
    rows.value = result.items;
    total.value = result.total;
  } catch {
    if (disposed || requestId !== latestLoadRequest) return;
    loadError.value = '知识条目加载失败，请稍后重试';
  } finally {
    if (!disposed && requestId === latestLoadRequest) loading.value = false;
  }
}
async function open(row?: KnowledgePoint) {
  const requestId = ++latestOpenRequest;
  editing.value = row;
  Object.assign(
    form,
    row
      ? {
          category: row.category || '',
          code: row.code,
          description: row.description || '',
          difficultyLevel: row.difficultyLevel,
          name: row.name,
          tags: row.tags || '',
        }
      : {
          category: '',
          code: '',
          description: '',
          difficultyLevel: undefined,
          name: '',
          tags: '',
        },
  );
  try {
    const relatedDocuments = row
      ? await getKnowledgeDocumentsByPoint(row.id)
      : [];
    if (disposed || requestId !== latestOpenRequest) return;
    selectedDocumentIds.value = relatedDocuments.map((item) => item.id);
    await searchDocumentOptions('');
    if (disposed || requestId !== latestOpenRequest) return;
    showDrawer.value = true;
  } catch {
    if (!disposed && requestId === latestOpenRequest) {
      message.error('知识条目详情加载失败，请稍后重试');
    }
  }
}
async function searchDocumentOptions(keyword: string) {
  const requestId = ++latestDocumentRequest;
  const spaceId = activeSpaceId.value;
  if (!spaceId) return;
  documentOptionsLoading.value = true;
  try {
    const result = await getDocuments(spaceId, {
      keyword: keyword.trim() || undefined,
      pageNum: 1,
      pageSize: 50,
    });
    const options = result.items.map((document) => ({
      label: document.title,
      value: document.id,
    }));
    const missingIds = selectedDocumentIds.value.filter(
      (id) => !options.some((option) => option.value === id),
    );
    if (missingIds.length > 0) {
      const missing = await Promise.all(
        missingIds.map((id) => getKnowledgeDocument(id)),
      );
      options.push(
        ...missing.map((document) => ({
          label: document.title,
          value: document.id,
        })),
      );
    }
    if (disposed || requestId !== latestDocumentRequest) return;
    documentOptions.value = options;
  } catch {
    if (!disposed && requestId === latestDocumentRequest) {
      message.error('文档选项加载失败，请稍后重试');
    }
  } finally {
    if (!disposed && requestId === latestDocumentRequest) {
      documentOptionsLoading.value = false;
    }
  }
}
async function saveDocumentRelations() {
  if (!editing.value) return;
  const pointId = editing.value.id;
  const documentIds = [...selectedDocumentIds.value];
  relationSaving.value = true;
  try {
    await replaceKnowledgePointDocuments(
      pointId,
      documentIds,
      relationType.value,
    );
    if (disposed) return;
    message.success('知识条目关联文档已更新');
  } catch {
    if (!disposed) message.error('知识条目关联文档保存失败，请稍后重试');
  } finally {
    if (!disposed) relationSaving.value = false;
  }
}
async function save() {
  await formRef.value?.validate();
  if (!activeSpaceId.value) return;
  saving.value = true;
  try {
    if (editing.value) {
      const { category, description, difficultyLevel, name, tags } = form;
      await updateKnowledgePoint(editing.value.id, {
        category,
        description,
        difficultyLevel,
        name,
        tags,
      });
    } else {
      await createKnowledgePoint(activeSpaceId.value, form);
    }
    if (disposed) return;
    message.success(editing.value ? '知识条目已更新' : '知识条目已创建');
    showDrawer.value = false;
    await load();
  } catch {
    if (!disposed) message.error('知识条目保存失败，请稍后重试');
  } finally {
    if (!disposed) saving.value = false;
  }
}
function remove(row: KnowledgePoint) {
  dialog.warning({
    title: '删除知识条目',
    content: `确认删除“${row.name}”吗？相关知识关系也可能受到影响。`,
    negativeText: '取消',
    positiveText: '删除',
    onPositiveClick: async () => {
      try {
        await deleteKnowledgePoint(row.id);
        if (disposed) return;
        message.success('知识条目已删除');
        await load();
      } catch {
        if (!disposed) message.error('知识条目删除失败，请稍后重试');
      }
    },
  });
}
function search() {
  pagination.page = 1;
  load();
}
const columns: DataTableColumns<KnowledgePoint> = [
  {
    key: 'name',
    minWidth: 240,
    title: '知识条目',
    render: (row) =>
      h('div', [
        h('div', { class: 'font-medium' }, row.name),
        h(
          'div',
          { class: 'mt-1 text-xs text-muted-foreground' },
          row.description || '待补充描述',
        ),
      ]),
  },
  { key: 'code', title: '编码', width: 150 },
  {
    key: 'category',
    title: '分类',
    width: 140,
    render: (row) => row.category || '-',
  },
  {
    key: 'difficultyLevel',
    title: '难度',
    width: 90,
    render: (row) => row.difficultyLevel ?? '-',
  },
  {
    key: 'tags',
    title: '标签',
    render: (row) =>
      row.tags
        ? h(
            'div',
            { class: 'flex flex-wrap gap-1' },
            parseTags(row.tags).map((tag) =>
              h(NTag, { size: 'small' }, { default: () => tag }),
            ),
          )
        : '-',
  },
  {
    key: 'actions',
    title: '操作',
    width: 220,
    render: (row) =>
      h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          { size: 'small', onClick: () => open(row) },
          { default: () => '详情/编辑' },
        ),
        h(
          NButton,
          {
            size: 'small',
            onClick: () =>
              router.push({
                path: '/knowledge-center/graph',
                query: { pointId: row.id },
              }),
          },
          { default: () => '关系' },
        ),
        h(
          NButton,
          { size: 'small', type: 'error', onClick: () => remove(row) },
          { default: () => '删除' },
        ),
      ]),
  },
];
watch(activeSpaceId, () => {
  pagination.page = 1;
  void load();
});

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
  latestOpenRequest += 1;
  latestDocumentRequest += 1;
});
</script>

<template>
  <Page
    title="知识条目"
    description="维护可复用的通用知识概念，并管理其文档来源和关系。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="load" />
    <NAlert v-if="loadError" type="warning" :bordered="false">
      {{ loadError }}
    </NAlert>
    <NCard :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-2">
          <NInput
            v-model:value="keyword"
            clearable
            placeholder="搜索名称、编码或分类"
            class="w-72"
            @keyup.enter="search"
          />
          <NButton @click="search">查询</NButton>
        </div>
        <NButton type="primary" :disabled="!activeSpaceId" @click="open()">
          新增知识条目
        </NButton>
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <NCard size="small">
          <div class="text-sm text-muted-foreground">条目总量</div>
          <div class="mt-2 text-2xl font-semibold">{{ total }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-muted-foreground">当前页已分类</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ rows.filter((item) => item.category).length }}
          </div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-muted-foreground">当前页待补描述</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ rows.filter((item) => !item.description).length }}
          </div>
        </NCard>
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
          activeSpaceId ? '当前空间暂无知识条目' : '请先选择或创建知识空间'
        "
        :action-text="activeSpaceId ? '新增知识条目' : undefined"
        @action="open()"
      />
    </NCard>

    <NDrawer v-model:show="showDrawer" :width="520">
      <NDrawerContent
        :title="editing ? '知识条目详情与编辑' : '新增知识条目'"
        closable
      >
        <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
          <div class="grid grid-cols-2 gap-3">
            <NFormItem
              :label="editing ? '编码（创建后不可修改）' : '编码'"
              path="code"
            >
              <NInput v-model:value="form.code" :readonly="Boolean(editing)" />
            </NFormItem>
            <NFormItem label="名称" path="name">
              <NInput v-model:value="form.name" />
            </NFormItem>
          </div>
          <NFormItem label="分类">
            <NInput
              v-model:value="form.category"
              placeholder="例如 产品、流程、技术"
            />
          </NFormItem>
          <NFormItem label="难度">
            <NSelect
              v-model:value="form.difficultyLevel"
              clearable
              :options="difficultyOptions"
            />
          </NFormItem>
          <NFormItem label="标签">
            <NInput
              v-model:value="form.tags"
              placeholder="多个标签用逗号分隔"
            />
          </NFormItem>
          <NFormItem label="描述">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :rows="6"
              placeholder="说明知识条目定义、边界和使用场景"
            />
          </NFormItem>
        </NForm>
        <div v-if="editing" class="mt-6 border-t pt-5">
          <div class="mb-2 font-medium">关联文档</div>
          <NSelect
            v-model:value="selectedDocumentIds"
            multiple
            filterable
            remote
            clearable
            :options="documentOptions"
            :loading="documentOptionsLoading"
            placeholder="搜索并选择当前空间的文档"
            @search="searchDocumentOptions"
          />
          <NSelect
            v-model:value="relationType"
            class="mt-3"
            :options="[
              { label: '相关资料', value: 'RELATED' },
              { label: '来源文档', value: 'SOURCE' },
              { label: '支持说明', value: 'SUPPORTS' },
              { label: '主要来源', value: 'PRIMARY_SOURCE' },
              { label: '参考资料', value: 'REFERENCE' },
            ]"
            placeholder="选择关联语义"
          />
          <div class="mt-2 text-xs text-muted-foreground">
            关联用于来源追溯和文档导航，不影响知识点独立使用。
          </div>
          <NButton
            class="mt-3"
            type="primary"
            :loading="relationSaving"
            @click="saveDocumentRelations"
          >
            保存文档关联
          </NButton>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton @click="showDrawer = false">取消</NButton
            ><NButton type="primary" :loading="saving" @click="save">
              保存
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </Page>
</template>
