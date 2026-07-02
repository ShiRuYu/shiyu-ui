<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { EducationSubjectApi } from '#/api/education/subject';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NDataTable, NInput, NSelect, NSpace } from 'naive-ui';

import { getSubjectList, searchKnowledgeApi } from '#/api';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const results = ref<any[]>([]);
const subjects = ref<EducationSubjectApi.Subject[]>([]);

const keyword = ref('');
const searchMode = ref('KEYWORD');
const subjectCode = ref<null | string>(null);

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: $t('knowledge.code'), key: 'code', width: 120 },
  { title: $t('knowledge.name'), key: 'name' },
  {
    title: $t('education.course.subjectCode'),
    key: 'subjectCode',
    width: 100,
    render(row) {
      return row.subjectCode;
    },
  },
  { title: $t('education.course.grade'), key: 'grade', width: 80 },
];

async function loadSubjects() {
  try {
    subjects.value = await getSubjectList();
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function handleSearch() {
  if (!keyword.value) return;
  loading.value = true;
  try {
    results.value = await searchKnowledgeApi({
      query: keyword.value,
      mode: searchMode.value,
    });
  } catch (error) {
    console.error('Failed to search knowledge:', error);
  } finally {
    loading.value = false;
  }
}

function goToKnowledge(row: any) {
  router.push({ path: `/learning/knowledge/${row.id}` });
}

onMounted(() => {
  loadSubjects();
});
</script>

<template>
  <Page :title="$t('page.learning.knowledge')">
    <div class="mb-4">
      <NSpace>
        <NInput
          v-model:value="keyword"
          :placeholder="$t('learning.searchKnowledge')"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        />
        <NSelect
          v-model:value="searchMode"
          :options="[
            { label: $t('learning.modeKeyword'), value: 'KEYWORD' },
            { label: $t('learning.modeSemantic'), value: 'SEMANTIC' },
            { label: $t('learning.modeHybrid'), value: 'HYBRID' },
          ]"
          style="width: 120px"
        />
        <NSelect
          v-model:value="subjectCode"
          :options="subjects.map((s) => ({ label: s.name, value: s.code }))"
          :placeholder="$t('education.course.subjectCode')"
          clearable
          style="width: 150px"
        />
        <NButton type="primary" @click="handleSearch">
          {{ $t('common.search') }}
        </NButton>
      </NSpace>
    </div>

    <NDataTable
      :columns="columns"
      :data="results"
      :loading="loading"
      :row-props="
        (row: any) => ({
          style: 'cursor: pointer',
          onClick: () => goToKnowledge(row),
        })
      "
      striped
    />
  </Page>
</template>
