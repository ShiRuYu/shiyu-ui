<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
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
  getKnowledgeDocumentsByPoint,
  replaceKnowledgePointDocuments,
} from '#/api/knowledge/document';
import { getDocuments, getKnowledgeDocument } from '#/api/knowledge/enterprise';
import {
  createKnowledgePoint,
  deleteKnowledgePoint,
  getKnowledgePoints,
  type KnowledgePoint,
  updateKnowledgePoint,
} from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';

const router = useRouter();
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId, difficultyScale } = storeToRefs(store);
const rows = ref<KnowledgePoint[]>([]);
const total = ref(0);
const keyword = ref('');
const loading = ref(false);
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
    message: '请输入知识点编码',
    trigger: ['blur', 'input'],
  },
  name: {
    required: true,
    message: '请输入知识点名称',
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
    .replace(/^\[|\]$/g, '')
    .split(/[,，]/)
    .map((item) => item.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

async function load() {
  if (!activeSpaceId.value) {
    rows.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await getKnowledgePoints(activeSpaceId.value, {
      keyword: keyword.value.trim() || undefined,
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
    });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}
async function open(row?: KnowledgePoint) {
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
  selectedDocumentIds.value = row
    ? (await getKnowledgeDocumentsByPoint(row.id)).map((item) => item.id)
    : [];
  await searchDocumentOptions('');
  showDrawer.value = true;
}
async function searchDocumentOptions(keyword: string) {
  if (!activeSpaceId.value) return;
  documentOptionsLoading.value = true;
  try {
    const result = await getDocuments(activeSpaceId.value, {
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
    if (missingIds.length) {
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
    documentOptions.value = options;
  } finally {
    documentOptionsLoading.value = false;
  }
}
async function saveDocumentRelations() {
  if (!editing.value) return;
  relationSaving.value = true;
  try {
    await replaceKnowledgePointDocuments(
      editing.value.id,
      selectedDocumentIds.value,
      relationType.value,
    );
    message.success('知识点关联文档已更新');
  } finally {
    relationSaving.value = false;
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
    message.success(editing.value ? '知识点已更新' : '知识点已创建');
    showDrawer.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}
function remove(row: KnowledgePoint) {
  dialog.warning({
    title: '删除知识点',
    content: `确认删除“${row.name}”吗？相关知识关系也可能受到影响。`,
    negativeText: '取消',
    positiveText: '删除',
    onPositiveClick: async () => {
      await deleteKnowledgePoint(row.id);
      message.success('知识点已删除');
      await load();
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
    title: '知识点',
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
                path: '/knowledge/graph',
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
onMounted(async () => {
  await store.loadSpaces();
  await load();
});
</script>

<template>
  <Page
    title="知识资产"
    description="维护知识点本体，持续提升内容完整度和可复用性。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="load" />
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
          新增知识点
        </NButton>
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <NCard size="small">
          <div class="text-sm text-muted-foreground">资产总量</div>
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
          activeSpaceId ? '当前空间暂无知识点' : '请先选择或创建知识空间'
        "
        :action-text="activeSpaceId ? '新增知识点' : undefined"
        @action="open()"
      />
    </NCard>

    <NDrawer v-model:show="showDrawer" :width="520">
      <NDrawerContent
        :title="editing ? '知识点详情与编辑' : '新增知识点'"
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
              placeholder="说明知识点定义、边界和使用场景"
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
