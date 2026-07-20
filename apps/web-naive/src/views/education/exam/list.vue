<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NCard, NInput, NSelect } from 'naive-ui';
import { getExamBySubjectApi, deleteExamApi } from '#/api/education/exam';
import { getSubjectListApi } from '#/api/education/subject';
import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchName = ref('');
const filterSubjectCode = ref('');
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteExamApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    if (filterSubjectCode.value) {
      const res = await getExamBySubjectApi(filterSubjectCode.value);
      tableData.value = res || [];
    } else {
      // Load all - try without filter first, fall back to fetching all subjects
      const res = await getExamBySubjectApi('');
      tableData.value = res || [];
    }
  } finally { loading.value = false; }
}

function filteredData() {
  let data = tableData.value;
  if (searchName.value) {
    const kw = searchName.value.toLowerCase();
    data = data.filter((r: any) => r.name && r.name.toLowerCase().includes(kw));
  }
  return data;
}

async function loadSubjectOptions() {
  try {
    const res = await getSubjectListApi();
    subjectOptions.value = (res || []).map((s: any) => ({ label: s.name, value: s.code }));
  } catch { /* ignore */ }
}

onMounted(() => {
  loadSubjectOptions();
  fetchData();
});
</script>

<template>
  <NCard title="试卷管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchName" placeholder="搜索试卷..." clearable style="width:160px" />
        <NSelect v-model:value="filterSubjectCode" :options="subjectOptions" placeholder="学科" clearable style="width:120px" @update:value="fetchData" />
        <NButton @click="() => { searchName = ''; filterSubjectCode = ''; fetchData(); }">重置</NButton>
        <NButton type="primary" @click="() => formModalRef?.open()">新增试卷</NButton>
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
