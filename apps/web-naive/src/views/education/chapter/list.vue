<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { NButton, NCard, NDataTable, NSelect, NSpace } from 'naive-ui';

import { deleteChapterApi, getChapterTreeApi } from '#/api/education/chapter';
import { getTextbookListApi } from '#/api/education/textbook';

import { flattenTree, getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const selectedTextbookId = ref<null | number>(null);
const textbookOptions = ref<Array<{ label: string; value: number }>>([]);

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row, selectedTextbookId.value),
  async (id: number) => {
    await deleteChapterApi(id);
    await fetchData();
  },
);

async function loadTextbookOptions() {
  try {
    const res = await getTextbookListApi();
    textbookOptions.value = (res || []).map((t: any) => ({
      label: t.name,
      value: t.id,
    }));
  } catch {
    /* ignore */
  }
}

async function fetchData() {
  if (!selectedTextbookId.value) {
    tableData.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await getChapterTreeApi(selectedTextbookId.value);
    tableData.value = flattenTree(res || []);
  } finally {
    loading.value = false;
  }
}

function onTextbookChange() {
  fetchData();
}

onMounted(loadTextbookOptions);
</script>

<template>
  <NCard title="章节管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NSelect
          v-model:value="selectedTextbookId"
          :options="textbookOptions"
          placeholder="请先选择教材"
          style="width: 220px"
          @update:value="onTextbookChange"
        />
        <NButton
          type="primary"
          :disabled="!selectedTextbookId"
          @click="() => formModalRef?.open()"
        >
          新增章节
        </NButton>
      </NSpace>
    </template>
    <NDataTable
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      size="small"
      striped
      :row-props="
        (row: any) => ({ style: { paddingLeft: `${row._depth * 24}px` } })
      "
    >
      <template #default="{ row }">
        <template v-if="row._indent">
          <span style="color: #999">{{ row._indent }}</span>
        </template>
      </template>
    </NDataTable>
    <FormModal ref="formModalRef" @success="fetchData" />
  </NCard>
</template>
