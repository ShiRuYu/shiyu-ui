<script setup lang="ts">
import type { DataTableColumns, FormInst, FormRules } from 'naive-ui';

import type { KnowledgeSpace } from '#/features/knowledge/api';
import type { SpaceMember } from '#/features/knowledge/api';

import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NTabPane,
  NTabs,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { dialog } from '#/adapter/naive';
import {
  createSpace,
  getKnowledgeDomainLabel,
  getSpaces,
} from '#/features/knowledge/api';
import {
  deleteSpace,
  getSpaceMembers,
  replaceSpaceMembers,
  updateSpace,
} from '#/features/knowledge/api';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '#/features/knowledge/ui/knowledge-empty-state.vue';
import KnowledgeStatusTag from '#/features/knowledge/ui/knowledge-status-tag.vue';

const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const keyword = ref('');
const rows = ref<KnowledgeSpace[]>([]);
const total = ref(0);
const loading = ref(false);
const pagination = reactive({ page: 1, pageSize: 10 });
const show = ref(false);
const saving = ref(false);
const editing = ref<KnowledgeSpace>();
const formRef = ref<FormInst>();
const members = ref<SpaceMember[]>([]);
const confirmCode = ref('');

const form = reactive({
  accessMode: 'PRIVATE',
  bindingMode: 'OPTIONAL',
  chunkOverlap: 100,
  chunkSize: 500,
  chunkStrategy: 'HEADING',
  code: '',
  description: '',
  domainCode: 'GENERAL',
  embeddingProfile: 'default',
  name: '',
  rerankProfile: 'default',
  reviewMode: 'OPTIONAL',
});
const rules: FormRules = {
  code: [
    { required: true, message: '请输入空间编码', trigger: ['blur', 'input'] },
    {
      pattern: /^[A-Za-z][A-Za-z0-9_-]{1,31}$/,
      message: '以字母开头，仅支持字母、数字、下划线和短横线',
      trigger: ['blur', 'input'],
    },
  ],
  name: {
    required: true,
    message: '请输入空间名称',
    trigger: ['blur', 'input'],
  },
};
async function loadPage() {
  loading.value = true;
  try {
    const result = await getSpaces({
      pageNum: pagination.page,
      pageSize: pagination.pageSize,
      keyword: keyword.value.trim() || undefined,
    });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}
function search() {
  pagination.page = 1;
  loadPage();
}

async function open(row?: KnowledgeSpace) {
  editing.value = row;
  Object.assign(
    form,
    row
      ? {
          accessMode: row.accessMode,
          bindingMode: row.bindingMode,
          chunkOverlap: row.chunkOverlap,
          chunkSize: row.chunkSize,
          chunkStrategy: row.chunkStrategy,
          code: row.code,
          description: row.description || '',
          domainCode: row.domainCode || 'GENERAL',
          embeddingProfile: row.embeddingProfile,
          name: row.name,
          rerankProfile: row.rerankProfile,
          reviewMode: row.reviewMode,
        }
      : {
          accessMode: 'PRIVATE',
          bindingMode: 'OPTIONAL',
          chunkOverlap: 100,
          chunkSize: 500,
          chunkStrategy: 'HEADING',
          code: '',
          description: '',
          domainCode: 'GENERAL',
          embeddingProfile: 'default',
          name: '',
          rerankProfile: 'default',
          reviewMode: 'OPTIONAL',
        },
  );
  members.value = row ? await getSpaceMembers(row.id) : [];
  show.value = true;
}

async function save() {
  await formRef.value?.validate();
  if (form.chunkOverlap >= form.chunkSize) {
    message.warning('分块重叠长度必须小于分块大小');
    return;
  }
  saving.value = true;
  try {
    const result = editing.value
      ? await updateSpace(editing.value.id, form)
      : await createSpace(form);
    if (editing.value) await replaceSpaceMembers(result.id, members.value);
    message.success(editing.value ? '空间已更新' : '空间已创建');
    show.value = false;
    await Promise.all([store.loadSpaces(true), loadPage()]);
    store.setActiveSpace(result.id);
  } finally {
    saving.value = false;
  }
}

function requestRemove(row: KnowledgeSpace) {
  confirmCode.value = '';
  dialog.warning({
    title: `删除空间“${row.name}”`,
    content: () =>
      h('div', { class: 'space-y-3' }, [
        h(
          'p',
          '删除后，该空间下的知识点、文档、关系和索引数据都将不可用。此操作不可撤销。',
        ),
        h('p', ['请输入空间编码 ', h('b', row.code), ' 以确认：']),
        h(NInput, {
          placeholder: row.code,
          value: confirmCode.value,
          'onUpdate:value': (value: string) => (confirmCode.value = value),
        }),
      ]),
    negativeText: '取消',
    positiveText: '永久删除',
    onPositiveClick: async () => {
      if (confirmCode.value !== row.code) {
        message.error('空间编码不匹配');
        return false;
      }
      await deleteSpace(row.id);
      message.success('空间已删除');
      await Promise.all([store.loadSpaces(true), loadPage()]);
    },
  });
}

const columns: DataTableColumns<KnowledgeSpace> = [
  {
    key: 'name',
    minWidth: 220,
    title: '空间',
    render: (row) =>
      h('div', [
        h('div', { class: 'font-medium' }, row.name),
        h(
          'div',
          { class: 'mt-1 text-xs text-muted-foreground' },
          row.description || '暂无描述',
        ),
      ]),
  },
  { key: 'code', title: '编码', width: 160 },
  {
    key: 'domainCode',
    title: '业务域',
    width: 100,
    render: (row) => getKnowledgeDomainLabel(row.domainCode),
  },
  {
    key: 'accessMode',
    title: '访问范围',
    width: 110,
    render: (row) => h(KnowledgeStatusTag, { value: row.accessMode }),
  },
  {
    key: 'reviewMode',
    title: '审核策略',
    width: 110,
    render: (row) => h(KnowledgeStatusTag, { value: row.reviewMode }),
  },
  {
    key: 'index',
    title: '索引',
    width: 100,
    render: (row) => `v${row.activeIndexVersion}`,
  },
  {
    key: 'actions',
    title: '操作',
    width: 190,
    render: (row) =>
      h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            type: row.id === activeSpaceId.value ? 'primary' : 'default',
            onClick: () => store.switchSpace(row.id),
          },
          {
            default: () =>
              row.id === activeSpaceId.value ? '当前空间' : '切换',
          },
        ),
        h(
          NButton,
          { size: 'small', onClick: () => open(row) },
          { default: () => '编辑' },
        ),
        h(
          NButton,
          { size: 'small', type: 'error', onClick: () => requestRemove(row) },
          { default: () => '删除' },
        ),
      ]),
  },
];

onMounted(async () => {
  await store.loadSpaces();
  await loadPage();
});
</script>

<template>
  <Page
    title="空间管理"
    description="配置知识、文档、权限和索引策略的隔离边界。"
  >
    <NCard :bordered="false">
      <div class="mb-4 flex flex-wrap justify-between gap-3">
        <NInput
          v-model:value="keyword"
          class="w-72"
          clearable
          placeholder="搜索空间名称或编码"
          @keyup.enter="search"
        />
        <NButton @click="search">查询</NButton>
        <NButton type="primary" @click="open()">新建空间</NButton>
      </div>
      <NDataTable
        v-if="rows.length || loading"
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
            loadPage();
          },
          onUpdatePageSize: (size: number) => {
            pagination.pageSize = size;
            pagination.page = 1;
            loadPage();
          },
        }"
      />
      <KnowledgeEmptyState
        v-else
        :action-text="keyword ? undefined : '创建第一个空间'"
        :description="keyword ? '没有匹配的知识空间' : '还没有知识空间'"
        @action="open()"
      />
    </NCard>

    <NModal
      v-model:show="show"
      preset="card"
      :title="editing ? '编辑空间' : '新建空间'"
      style="width: min(720px, 94vw)"
    >
      <NTabs type="line">
        <NTabPane name="base" tab="基本信息">
          <NForm
            ref="formRef"
            :model="form"
            :rules="rules"
            label-placement="top"
          >
            <div class="grid gap-x-4 md:grid-cols-2">
              <NFormItem label="空间编码" path="code">
                <NInput
                  v-model:value="form.code"
                  :disabled="!!editing"
                  placeholder="例如 product_docs"
                />
              </NFormItem>
              <NFormItem label="空间名称" path="name">
                <NInput
                  v-model:value="form.name"
                  placeholder="便于团队识别的名称"
                />
              </NFormItem>
            </div>
            <NFormItem label="空间描述">
              <NInput
                v-model:value="form.description"
                type="textarea"
                :rows="3"
                placeholder="说明内容范围和使用对象"
              />
            </NFormItem>
            <div class="grid gap-x-4 md:grid-cols-2">
              <NFormItem label="访问范围">
                <NSelect
                  v-model:value="form.accessMode"
                  :options="[
                    { label: '仅授权成员', value: 'PRIVATE' },
                    { label: '租户内可见', value: 'TENANT' },
                  ]"
                />
              </NFormItem>
              <NFormItem label="业务域">
                <NSelect
                  v-model:value="form.domainCode"
                  :disabled="Boolean(editing)"
                  :options="[
                    { label: '通用', value: 'GENERAL' },
                    { label: '企业', value: 'ENTERPRISE' },
                    { label: '教育', value: 'EDUCATION' },
                  ]"
                />
              </NFormItem>
              <NFormItem label="审核策略">
                <NSelect
                  v-model:value="form.reviewMode"
                  :options="[
                    { label: '可选审核', value: 'OPTIONAL' },
                    { label: '必须审核', value: 'REQUIRED' },
                    { label: '直接发布', value: 'DIRECT' },
                  ]"
                />
              </NFormItem>
              <NFormItem label="文档知识点关联">
                <NSelect
                  v-model:value="form.bindingMode"
                  :options="[
                    { label: '可选关联', value: 'OPTIONAL' },
                    { label: '发布前必须关联', value: 'REQUIRED' },
                  ]"
                />
              </NFormItem>
            </div>
          </NForm>
        </NTabPane>
        <NTabPane name="content" tab="内容策略">
          <div class="grid gap-x-4 md:grid-cols-2">
            <NFormItem label="分块大小">
              <NInputNumber
                v-model:value="form.chunkSize"
                :min="100"
                :max="4000"
                class="w-full"
              />
            </NFormItem>
            <NFormItem label="重叠长度">
              <NInputNumber
                v-model:value="form.chunkOverlap"
                :min="0"
                :max="1000"
                class="w-full"
              />
            </NFormItem>
            <NFormItem label="分段策略">
              <NSelect
                v-model:value="form.chunkStrategy"
                :options="[
                  { label: '按标题和段落', value: 'HEADING' },
                  { label: '按固定长度', value: 'FIXED' },
                ]"
              />
            </NFormItem>
            <NFormItem label="Embedding 模型档案">
              <NInput
                v-model:value="form.embeddingProfile"
                placeholder="例如 default 或本地模型档案名"
              />
            </NFormItem>
            <NFormItem label="重排模型档案">
              <NInput
                v-model:value="form.rerankProfile"
                placeholder="例如 default 或本地模型档案名"
              />
            </NFormItem>
          </div>
          <div class="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            较大的分块保留更多上下文，较小的分块更利于精确召回。重叠长度必须小于分块大小。
          </div>
        </NTabPane>
        <NTabPane name="members" tab="成员权限" :disabled="!editing">
          <div class="space-y-3">
            <div
              v-for="(member, index) in members"
              :key="index"
              class="flex gap-3"
            >
              <NSelect
                v-model:value="member.principalType"
                class="w-28"
                :options="[
                  { label: '用户', value: 'USER' },
                  { label: '角色', value: 'ROLE' },
                ]"
              />
              <NInputNumber
                v-model:value="member.principalId"
                :min="1"
                class="flex-1"
                :placeholder="
                  member.principalType === 'ROLE' ? '角色 ID' : '用户 ID'
                "
              />
              <NSelect
                v-model:value="member.spaceRole"
                class="w-40"
                :options="[
                  { label: '管理员', value: 'ADMIN' },
                  { label: '编辑者', value: 'EDITOR' },
                  { label: '审核者', value: 'REVIEWER' },
                  { label: '查看者', value: 'VIEWER' },
                ]"
              />
              <NButton type="error" @click="members.splice(index, 1)">
                移除
              </NButton>
            </div>
            <NButton
              dashed
              block
              @click="
                members.push({
                  principalType: 'USER',
                  principalId: 1,
                  spaceRole: 'VIEWER',
                })
              "
            >
              添加成员
            </NButton>
          </div>
        </NTabPane>
      </NTabs>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="show = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="save">保存</NButton>
        </div>
      </template>
    </NModal>
  </Page>
</template>
