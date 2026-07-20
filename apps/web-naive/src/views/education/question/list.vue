<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NCard, NInput, NSelect, NInputNumber } from 'naive-ui';
import { getQuestionBySubjectAndGradeApi, getQuestionByDifficultyApi, getQuestionByTypeApi, deleteQuestionApi } from '#/api/education/question';
import { getSubjectListApi } from '#/api/education/subject';
import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchTitle = ref('');
const filterSubjectCode = ref('');
const filterGrade = ref<number | null>(null);
const filterDifficulty = ref<number | null>(null);
const filterType = ref('');
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const gradeOptions = [
  { label: '一年级', value: 1 }, { label: '二年级', value: 2 }, { label: '三年级', value: 3 },
  { label: '四年级', value: 4 }, { label: '五年级', value: 5 }, { label: '六年级', value: 6 },
  { label: '七年级', value: 7 }, { label: '八年级', value: 8 }, { label: '九年级', value: 9 },
  { label: '高一', value: 10 }, { label: '高二', value: 11 }, { label: '高三', value: 12 },
];

const difficultyOptions = [
  { label: '简单', value: 1 }, { label: '中等', value: 2 },
  { label: '较难', value: 3 }, { label: '困难', value: 4 },
];

const typeOptions = [
  { label: '选择题', value: 'CHOICE' },
  { label: '填空题', value: 'FILL' },
  { label: '判断题', value: 'JUDGE' },
  { label: '简答题', value: 'SHORT' },
  { label: '计算题', value: 'CALC' },
];

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteQuestionApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    let res: any[] = [];
    if (filterSubjectCode.value && filterGrade.value) {
      res = await getQuestionBySubjectAndGradeApi(filterSubjectCode.value, filterGrade.value) || [];
    } else if (filterDifficulty.value) {
      res = await getQuestionByDifficultyApi(filterDifficulty.value) || [];
    } else if (filterType.value) {
      res = await getQuestionByTypeApi(filterType.value) || [];
    }
    tableData.value = res;
  } finally { loading.value = false; }
}

function filteredData() {
  let data = tableData.value;
  if (searchTitle.value) {
    const kw = searchTitle.value.toLowerCase();
    data = data.filter((r: any) => r.title && r.title.toLowerCase().includes(kw));
  }
  return data;
}

async function loadSubjectOptions() {
  try {
    const res = await getSubjectListApi();
    subjectOptions.value = (res || []).map((s: any) => ({ label: s.name, value: s.code }));
  } catch { /* ignore */ }
}

onMounted(loadSubjectOptions);
</script>

<template>
  <NCard title="题库管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchTitle" placeholder="搜索题目..." clearable style="width:160px" />
        <NSelect v-model:value="filterSubjectCode" :options="subjectOptions" placeholder="学科" clearable style="width:100px" />
        <NSelect v-model:value="filterGrade" :options="gradeOptions" placeholder="年级" clearable style="width:100px" />
        <NSelect v-model:value="filterDifficulty" :options="difficultyOptions" placeholder="难度" clearable style="width:90px" />
        <NSelect v-model:value="filterType" :options="typeOptions" placeholder="类型" clearable style="width:90px" />
        <NButton type="primary" @click="fetchData">查询</NButton>
        <NButton @click="() => { searchTitle = ''; filterSubjectCode = ''; filterGrade = null; filterDifficulty = null; filterType = ''; tableData = []; }">重置</NButton>
        <NButton type="primary" @click="() => formModalRef?.open()">新增题目</NButton>
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
      :max-height="600"
      virtual-scroll
    />
    <FormModal ref="formModalRef" @success="fetchData" />
  </NCard>
</template>
