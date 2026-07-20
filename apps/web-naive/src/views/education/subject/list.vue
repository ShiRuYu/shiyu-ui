<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { NButton, NCard, NDataTable, NInput, NSpace } from 'naive-ui';

import { deleteSubjectApi, getSubjectListApi } from '#/api/education/subject';

import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchKeyword = ref('');

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteSubjectApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    const res = await getSubjectListApi();
    tableData.value = res || [];
  } finally {
    loading.value = false;
  }
}

function filteredData() {
  if (!searchKeyword.value) return tableData.value;
  const kw = searchKeyword.value.toLowerCase();
  return tableData.value.filter(
    (r: any) =>
      (r.name && r.name.toLowerCase().includes(kw)) ||
      (r.code && r.code.toLowerCase().includes(kw)),
  );
}

onMounted(fetchData);
</script>

<template>
  <NCard title="学科管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput
          v-model:value="searchKeyword"
          placeholder="搜索学科..."
          clearable
          style="width: 200px"
        />
        <NButton type="primary" @click="() => formModalRef?.open()">
新增学科
</NButton>
      </NSpace>
    </template>
    <NDataTable
      :columns="columns"
      :data="filteredData()"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      size="small"
      striped
    />
    <FormModal ref="formModalRef" @success="fetchData" />
  </NCard>
</template>
