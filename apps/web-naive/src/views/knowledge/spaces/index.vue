<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { createSpace } from '#/api/knowledge/enterprise';
import { deleteSpace, updateSpace } from '#/api/knowledge/space';
import { useKnowledgeStore } from '#/store';
const message = useMessage();
const store = useKnowledgeStore();
const { spaces } = storeToRefs(store);
const keyword = ref('');
const show = ref(false);
const editing = ref<number>();
const form = reactive({
  code: '',
  name: '',
  description: '',
  reviewMode: 'OPTIONAL',
});
function open(row?: any) {
  editing.value = row?.id;
  Object.assign(
    form,
    row
      ? {
          code: row.code,
          name: row.name,
          description: row.description || '',
          reviewMode: row.reviewMode,
        }
      : { code: '', name: '', description: '', reviewMode: 'OPTIONAL' },
  );
  show.value = true;
}
async function save() {
  editing.value
    ? await updateSpace(editing.value, form)
    : await createSpace(form);
  message.success(editing.value ? '空间已更新' : '空间已创建');
  show.value = false;
  await store.loadSpaces();
}
async function remove(id: number) {
  await deleteSpace(id);
  message.success('空间已删除');
  await store.loadSpaces();
}
onMounted(() => store.loadSpaces());
const columns = [
  { title: '空间名称', key: 'name', minWidth: 200 },
  { title: '编码', key: 'code', width: 180 },
  { title: '审核策略', key: 'reviewMode', width: 110 },
  { title: '索引版本', key: 'activeIndexVersion', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: () => h(NTag, { type: 'success' }, { default: () => '正常' }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: any) =>
      h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          { size: 'small', onClick: () => open(row) },
          { default: () => '编辑' },
        ),
        h(
          NPopconfirm,
          { onPositiveClick: () => remove(row.id) },
          {
            trigger: () =>
              h(
                NButton,
                { size: 'small', type: 'error' },
                { default: () => '删除' },
              ),
            default: () => '确认删除该空间？',
          },
        ),
      ]),
  },
];
</script>
<template>
  <Page
    title="空间管理"
    description="空间是知识、文档、成员权限和索引版本的隔离边界。"
    >
<NCard :bordered="false"
      >
<div class="mb-4 flex flex-wrap justify-between gap-3">
        <NInput
          v-model:value="keyword"
          class="w-72"
          placeholder="搜索空间名称或编码"
        /><NButton type="primary" @click="open()">新建空间</NButton>
      </div>
      <NDataTable
        :columns="columns"
        :data="
          spaces.filter(
            (item) =>
              !keyword ||
              item.name.includes(keyword) ||
              item.code.includes(keyword),
          )
        "
        :pagination="{ pageSize: 10 }"
        :bordered="false" />
</NCard
    ><NModal
      v-model:show="show"
      preset="card"
      :title="editing ? '编辑空间' : '新建空间'"
      style="width: 560px"
      >
<NForm :model="form"
        >
<NFormItem label="空间编码"
          >
<NInput v-model:value="form.code" :disabled="!!editing" />
</NFormItem
        ><NFormItem label="空间名称"
          >
<NInput v-model:value="form.name" />
</NFormItem
        ><NFormItem label="描述"
          >
<NInput
            v-model:value="form.description"
            type="textarea" />
</NFormItem
        ><NFormItem label="审核策略"
          >
<NSelect
            v-model:value="form.reviewMode"
            :options="[
              { label: '可选审核', value: 'OPTIONAL' },
              { label: '必须审核', value: 'REQUIRED' },
              { label: '直接发布', value: 'DIRECT' },
            ]" />
</NFormItem>
</NForm
      ><template #footer
        >
<NButton type="primary" @click="save">保存</NButton>
</template
      >
</NModal
    >
</Page
  >
</template>
