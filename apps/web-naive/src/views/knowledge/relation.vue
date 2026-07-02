<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NCard, NDataTable, NSpace, NButton, NSelect, NModal, NForm, NFormItem, NInputNumber, NPopconfirm, NTag, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { getKnowledgePrerequisitesListApi, getKnowledgeSubsequentListApi, addKnowledgeRelationApi, deleteKnowledgeRelationApi, getKnowledgeListApi } from '#/api/knowledge';

const router = useRouter();
const message = useMessage();
const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedKnowledgeId = ref<number | null>(null);
const prerequisites = ref<any[]>([]);
const subsequent = ref<any[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const addForm = ref({ targetId: null as number | null, type: 'PRE', weight: 1.0 });

const relationTypeOptions = [
  { label: '前置知识 (PRE)', value: 'PRE' },
  { label: '后续知识 (NEXT)', value: 'NEXT' },
  { label: '包含关系 (INCLUDE)', value: 'INCLUDE' },
  { label: '关联 (RELATED)', value: 'RELATED' },
  { label: '相似 (SIMILAR)', value: 'SIMILAR' },
  { label: '属于 (BELONG)', value: 'BELONG' },
];

async function loadOptions() {
  const list = await getKnowledgeListApi();
  knowledgeOptions.value = (list || []).map((k: any) => ({ label: `[${k.code}] ${k.name}`, value: k.id }));
}

async function loadRelations() {
  if (!selectedKnowledgeId.value) return;
  loading.value = true;
  try {
    const [pre, sub] = await Promise.all([
      getKnowledgePrerequisitesListApi(selectedKnowledgeId.value),
      getKnowledgeSubsequentListApi(selectedKnowledgeId.value),
    ]);
    prerequisites.value = pre || [];
    subsequent.value = sub || [];
  } finally { loading.value = false; }
}

async function handleAddRelation() {
  if (!selectedKnowledgeId.value || !addForm.value.targetId) return;
  try {
    await addKnowledgeRelationApi({
      sourceId: selectedKnowledgeId.value,
      targetId: addForm.value.targetId,
      type: addForm.value.type,
      weight: addForm.value.weight,
    });
    message.success('关系已添加');
    showAddModal.value = false;
    addForm.value = { targetId: null, type: 'PRE', weight: 1.0 };
    await loadRelations();
  } catch (e: any) {
    message.error(e.message || '添加失败');
  }
}

async function handleDeleteRelation(targetId: number, type: string, isPre: boolean) {
  if (!selectedKnowledgeId.value) return;
  const sourceId = isPre ? targetId : selectedKnowledgeId.value;
  const tarId = isPre ? selectedKnowledgeId.value : targetId;
  await deleteKnowledgeRelationApi(sourceId, tarId, type);
  message.success('关系已删除');
  await loadRelations();
}

const preColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '编码', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 200 },
  { title: '关系类型', key: 'relationType', width: 120,
    render: (row: any) => h(NTag, { size: 'small' }, row.relationType || 'PRE'),
  },
  { title: '操作', key: 'actions', width: 100,
    render: (row: any) => h(NPopconfirm, {
      onPositiveClick: () => handleDeleteRelation(row.id, row.relationType || 'PRE', true),
    }, { default: () => '确认删除？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '解除') }),
  },
];
const subColumns = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '编码', key: 'code', width: 120 },
  { title: '名称', key: 'name', width: 200 },
  { title: '关系类型', key: 'relationType', width: 120,
    render: (row: any) => h(NTag, { size: 'small' }, row.relationType || 'NEXT'),
  },
  { title: '操作', key: 'actions', width: 100,
    render: (row: any) => h(NPopconfirm, {
      onPositiveClick: () => handleDeleteRelation(row.id, row.relationType || 'NEXT', false),
    }, { default: () => '确认删除？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '解除') }),
  },
];

onMounted(() => { loadOptions(); });
</script>

<template>
  <NCard title="知识关系管理" :bordered="false">
    <template #header-extra>
      <NSpace>
        <NSelect
          v-model:value="selectedKnowledgeId"
          :options="knowledgeOptions"
          placeholder="选择知识点"
          filterable
          style="width:300px"
          @update:value="loadRelations"
        />
        <NButton v-if="selectedKnowledgeId" type="primary" @click="showAddModal = true">添加关系</NButton>
      </NSpace>
    </template>

    <NSpace vertical v-if="selectedKnowledgeId">
      <h4>前置知识点（当前知识点的前提）</h4>
      <NDataTable :columns="preColumns" :data="prerequisites" :loading="loading" size="small" striped />

      <h4 class="mt-4">后续知识点（依赖当前知识点）</h4>
      <NDataTable :columns="subColumns" :data="subsequent" :loading="loading" size="small" striped />
    </NSpace>

    <NEmpty v-else description="请先选择知识点" />

    <NModal v-model:show="showAddModal" title="添加知识关系" preset="card" style="width:500px">
      <NForm :model="addForm" label-placement="left" label-width="100">
        <NFormItem label="目标知识点">
          <NSelect v-model:value="addForm.targetId" :options="knowledgeOptions" filterable placeholder="选择目标知识点" />
        </NFormItem>
        <NFormItem label="关系类型">
          <NSelect v-model:value="addForm.type" :options="relationTypeOptions" />
        </NFormItem>
        <NFormItem label="权重">
          <NInputNumber v-model:value="addForm.weight" :min="0" :max="2" :step="0.1" style="width:100%" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAddModal = false">取消</NButton>
          <NButton type="primary" @click="handleAddRelation">添加</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
