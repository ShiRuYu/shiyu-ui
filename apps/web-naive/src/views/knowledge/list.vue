<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NCard, NInput, NSelect } from 'naive-ui';
import { useRouter } from 'vue-router';
import { getKnowledgeListApi, deleteKnowledgeApi, searchKnowledgeApi } from '#/api/knowledge';
import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const router = useRouter();
const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchKeyword = ref('');
const searchCategory = ref('');

const columns = getTableColumns(
  (row: any) => formModalRef.value?.open(row),
  async (id: number) => {
    await deleteKnowledgeApi(id);
    await fetchData();
  },
);

async function fetchData() {
  loading.value = true;
  try {
    const res = await getKnowledgeListApi();
    tableData.value = res || [];
  } finally { loading.value = false; }
}

async function handleSearch() {
  if (!searchKeyword.value && !searchCategory.value) {
    await fetchData();
    return;
  }
  loading.value = true;
  try {
    const params: Recordable = {};
    if (searchKeyword.value) params.query = searchKeyword.value;
    if (searchCategory.value) params.category = searchCategory.value;
    if (params.query) {
      const res = await searchKnowledgeApi({ query: params.query });
      tableData.value = res || [];
    } else {
      const res = await getKnowledgeListApi(params);
      tableData.value = res || [];
    }
  } finally { loading.value = false; }
}

function goToRelation(knowledgeId: number) {
  router.push(`/knowledge/relation?knowledgeId=${knowledgeId}`);
}

function goToGraph(knowledgeId: number) {
  router.push(`/knowledge/graph?knowledgeId=${knowledgeId}`);
}

onMounted(fetchData);
</script>

<template>
  <NCard title="知识点管理" :bordered="false" class="h-full">
    <template #header-extra>
      <NSpace>
        <NInput v-model:value="searchKeyword" placeholder="搜索知识点..." clearable style="width:200px" @keyup.enter="handleSearch" />
        <NInput v-model:value="searchCategory" placeholder="分类筛选" clearable style="width:120px" @keyup.enter="handleSearch" />
        <NButton type="primary" @click="handleSearch">搜索</NButton>
        <NButton @click="() => { searchKeyword=''; searchCategory=''; fetchData(); }">重置</NButton>
        <NButton type="primary" @click="() => formModalRef?.open()">新增知识点</NButton>
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
      class="mt-4"
    />
    <FormModal ref="formModalRef" @success="fetchData" />
  </NCard>
</template>
