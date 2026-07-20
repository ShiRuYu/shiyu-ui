<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NSelect,
  NSpace,
} from 'naive-ui';

import { getSubjectListApi } from '#/api/education/subject';
import {
  deleteTextbookApi,
  getTextbookBySubjectAndGradeApi,
  getTextbookListApi,
} from '#/api/education/textbook';

import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchName = ref('');
const filterSubjectCode = ref('');
const filterGrade = ref<null | number>(null);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const gradeOptions = computed(() => {
  const options = [];
  for (let i = 1; i <= 12; i++) {
    const map: Record<number, string> = {
      1: '一年级',
      2: '二年级',
      3: '三年级',
      4: '四年级',
      5: '五年级',
      6: '六年级',
      7: '七年级',
      8: '八年级',
      9: '九年级',
      10: '高一',
      11: '高二',
      12: '高三',
    };
    options.push({ label: map[i], value: i });
  }
  return options;
});

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteTextbookApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    if (filterSubjectCode.value && filterGrade.value) {
      const res = await getTextbookBySubjectAndGradeApi(
        filterSubjectCode.value,
        filterGrade.value,
      );
      tableData.value = res || [];
    } else {
      const res = await getTextbookListApi();
      tableData.value = res || [];
    }
  } finally {
    loading.value = false;
  }
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
    subjectOptions.value = (res || []).map((s: any) => ({
      label: s.name,
      value: s.code,
    }));
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  loadSubjectOptions();
  fetchData();
});
</script>

<template>
  <NCard title="教材管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput
          v-model:value="searchName"
          placeholder="搜索教材..."
          clearable
          style="width: 160px"
        />
        <NSelect
          v-model:value="filterSubjectCode"
          :options="subjectOptions"
          placeholder="学科"
          clearable
          style="width: 120px"
        />
        <NSelect
          v-model:value="filterGrade"
          :options="gradeOptions"
          placeholder="年级"
          clearable
          style="width: 120px"
        />
        <NButton type="primary" @click="fetchData">查询</NButton>
        <NButton
          @click="
            () => {
              searchName = '';
              filterSubjectCode = '';
              filterGrade = null;
              fetchData();
            }
          "
          >
重置
</NButton>
        <NButton type="primary" @click="() => formModalRef?.open()">
新增教材
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
