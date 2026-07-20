<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NCard, NInput, NSelect } from 'naive-ui';
import { getCourseListApi, deleteCourseApi, getCourseBySubjectApi, getCourseByGradeApi } from '#/api/education/course';
import { getSubjectListApi } from '#/api/education/subject';
import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchName = ref('');
const filterSubjectCode = ref('');
const filterGrade = ref<number | null>(null);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const gradeOptions = computed(() => {
  const map: Record<number, string> = {
    1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
    7: '七年级', 8: '八年级', 9: '九年级', 10: '高一', 11: '高二', 12: '高三',
  };
  return Array.from({ length: 12 }, (_, i) => ({ label: map[i + 1], value: i + 1 }));
});

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteCourseApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    let res;
    if (filterSubjectCode.value) {
      res = await getCourseBySubjectApi(filterSubjectCode.value);
    } else if (filterGrade.value) {
      res = await getCourseByGradeApi(filterGrade.value);
    } else {
      res = await getCourseListApi();
    }
    tableData.value = res || [];
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
  <NCard title="课程管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchName" placeholder="搜索课程..." clearable style="width:160px" />
        <NSelect v-model:value="filterSubjectCode" :options="subjectOptions" placeholder="学科" clearable style="width:120px" @update:value="fetchData" />
        <NSelect v-model:value="filterGrade" :options="gradeOptions" placeholder="年级" clearable style="width:120px" @update:value="fetchData" />
        <NButton @click="() => { searchName = ''; filterSubjectCode = ''; filterGrade = null; fetchData(); }">重置</NButton>
        <NButton type="primary" @click="() => formModalRef?.open()">新增课程</NButton>
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
