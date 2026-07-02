<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NCard, NDataTable, NInput, NSpace, NPopconfirm, NTag, NSelect } from 'naive-ui';
import { getDocumentsByKnowledgeApi, searchDocumentsApi, deleteDocumentApi } from '#/api/knowledge/document';
import { getKnowledgeListApi } from '#/api/knowledge';
import FormModal from './modules/form.vue';

const tableData = ref<any[]>([]);
const loading = ref(false);
const formModalRef = ref<any>(null);
const searchKeyword = ref('');
const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedKnowledgeId = ref<number | null>(null);

const columns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title', width: 250, ellipsis: { tooltip: true } },
  { title: '类型', key: 'docType', width: 120,
    render: (row: any) => h(NTag, { size: 'small' }, row.docType || 'ARTICLE'),
  },
  { title: '来源', key: 'source', width: 150, ellipsis: { tooltip: true } },
  { title: '作者', key: 'author', width: 120 },
  { title: '操作', key: 'actions', width: 200, align: 'center',
    render: (row: any) => h(NSpace, { justify: 'center' }, [
      h(NButton, { size: 'small', type: 'primary', onClick: () => formModalRef.value?.open(row) }, '编辑'),
      h(NPopconfirm, { onPositiveClick: async () => { await deleteDocumentApi(row.id); await fetchData(); } },
        { default: () => '确认删除？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
    ]),
  },
];

async function fetchData() {
  loading.value = true;
  try {
    if (selectedKnowledgeId.value) {
      const res = await getDocumentsByKnowledgeApi(selectedKnowledgeId.value);
      tableData.value = res || [];
    } else if (searchKeyword.value) {
      const res = await searchDocumentsApi({ keyword: searchKeyword.value });
      tableData.value = res || [];
    } else {
      tableData.value = [];
    }
  } finally { loading.value = false; }
}

async function loadOptions() {
  const list = await getKnowledgeListApi();
  knowledgeOptions.value = (list || []).map((k: any) => ({ label: `[${k.code}] ${k.name}`, value: k.id }));
}

onMounted(loadOptions);
</script>

<template>
  <NCard title="文档管理" :bordered="false">
    <template #header-extra>
      <NSpace>
        <NSelect
          v-model:value="selectedKnowledgeId"
          :options="knowledgeOptions"
          placeholder="按知识点筛选"
          filterable
          clearable
          style="width:220px"
          @update:value="fetchData"
        />
        <NInput v-model:value="searchKeyword" placeholder="搜索文档..." clearable style="width:200px" @keyup.enter="fetchData" />
        <NButton type="primary" @click="fetchData">搜索</NButton>
        <NButton type="primary" @click="() => formModalRef?.open(null, selectedKnowledgeId)">新增文档</NButton>
      </NSpace>
    </template>
    <NDataTable :columns="columns" :data="tableData" :loading="loading" size="small" striped class="mt-4" />
    <FormModal ref="formModalRef" @success="fetchData" />
  </NCard>
</template>
