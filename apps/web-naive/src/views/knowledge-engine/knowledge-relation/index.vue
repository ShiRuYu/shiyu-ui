<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  addKnowledgeRelationApi,
  deleteKnowledgeRelationApi,
  getKnowledgeListApi,
  getKnowledgePrerequisitesListApi,
  getKnowledgeSubsequentListApi,
} from '#/api/knowledge';
import { $t } from '#/locales';

const message = useMessage();
const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedKnowledgeId = ref<number | null>(null);
const prerequisites = ref<any[]>([]);
const subsequent = ref<any[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const addForm = ref({ targetId: null as number | null, type: 'PRE', weight: 1.0 });

const relationTypeOptions = computed(() => [
  { label: `${$t('knowledge.relationPre')} (PRE)`, value: 'PRE' },
  { label: `${$t('knowledge.relationNext')} (NEXT)`, value: 'NEXT' },
  { label: `${$t('knowledge.relationInclude')} (INCLUDE)`, value: 'INCLUDE' },
  { label: `${$t('knowledge.relationRelated')} (RELATED)`, value: 'RELATED' },
  { label: `${$t('knowledge.relationSimilar')} (SIMILAR)`, value: 'SIMILAR' },
  { label: `${$t('knowledge.relationBelong')} (BELONG)`, value: 'BELONG' },
]);

const targetKnowledgeOptions = computed(() => {
  return knowledgeOptions.value.filter((opt) => opt.value !== selectedKnowledgeId.value);
});

async function loadOptions() {
  const result = await getKnowledgeListApi({ pageSize: 9999 });
  const list = result?.items || result || [];
  knowledgeOptions.value = list.map((k: any) => ({ label: `[${k.code}] ${k.name}`, value: k.id }));
}

async function loadRelations() {
  if (!selectedKnowledgeId.value) return;
  loading.value = true;
  try {
    const [pre, sub] = await Promise.all([
      getKnowledgePrerequisitesListApi(selectedKnowledgeId.value),
      getKnowledgeSubsequentListApi(selectedKnowledgeId.value),
    ]);
    prerequisites.value = Array.isArray(pre) ? pre : ((pre as any)?.items || (pre as any)?.data || []);
    subsequent.value = Array.isArray(sub) ? sub : ((sub as any)?.items || (sub as any)?.data || []);
  } finally {
    loading.value = false;
  }
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
    message.success($t('knowledge.relationAdded'));
    showAddModal.value = false;
    addForm.value = { targetId: null, type: 'PRE', weight: 1.0 };
    await loadRelations();
  } catch (e: any) {
    message.error(e.message || $t('knowledge.addFailed'));
  }
}

async function handleDeleteRelation(targetId: number, type: string, isPre: boolean) {
  if (!selectedKnowledgeId.value) return;
  const sourceId = isPre ? targetId : selectedKnowledgeId.value;
  const tarId = isPre ? selectedKnowledgeId.value : targetId;
  await deleteKnowledgeRelationApi(sourceId, tarId, type);
  message.success($t('knowledge.relationDeleted'));
  await loadRelations();
}

const preColumns = computed(() => [
  { title: 'ID', key: 'id', width: 80 },
  { title: $t('knowledge.code'), key: 'code', width: 120 },
  { title: $t('knowledge.name'), key: 'name', width: 200 },
  {
    title: $t('knowledge.relationType'),
    key: 'relationType',
    width: 120,
    render: (row: any) => h(NTag, { size: 'small' }, row.relationType || 'PRE'),
  },
  {
    title: $t('common.operation'),
    key: 'actions',
    width: 100,
    render: (row: any) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteRelation(row.id, row.relationType || 'PRE', true),
        },
        { default: () => $t('knowledge.confirmDelete'), trigger: () => h(NButton, { size: 'small', type: 'error' }, $t('knowledge.release')) },
      ),
  },
]);

const subColumns = computed(() => [
  { title: 'ID', key: 'id', width: 80 },
  { title: $t('knowledge.code'), key: 'code', width: 120 },
  { title: $t('knowledge.name'), key: 'name', width: 200 },
  {
    title: $t('knowledge.relationType'),
    key: 'relationType',
    width: 120,
    render: (row: any) => h(NTag, { size: 'small' }, row.relationType || 'NEXT'),
  },
  {
    title: $t('common.operation'),
    key: 'actions',
    width: 100,
    render: (row: any) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteRelation(row.id, row.relationType || 'NEXT', false),
        },
        { default: () => $t('knowledge.confirmDelete'), trigger: () => h(NButton, { size: 'small', type: 'error' }, $t('knowledge.release')) },
      ),
  },
]);

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <Page auto-content-height>
    <NCard :title="$t('knowledge.addRelation')" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedKnowledgeId"
            :options="knowledgeOptions"
            :placeholder="$t('knowledge.selectKnowledge')"
            filterable
            style="width: 300px"
            @update:value="loadRelations"
          />
          <NButton v-if="selectedKnowledgeId" type="primary" @click="showAddModal = true">
            {{ $t('knowledge.addRelation') }}
          </NButton>
        </NSpace>
      </template>

      <NSpace v-if="selectedKnowledgeId" vertical>
        <h4>{{ $t('knowledge.prerequisiteKnowledge') }}</h4>
        <NDataTable :columns="preColumns" :data="prerequisites" :loading="loading" size="small" striped />

        <h4 class="mt-4">{{ $t('knowledge.subsequentKnowledge') }}</h4>
        <NDataTable :columns="subColumns" :data="subsequent" :loading="loading" size="small" striped />
      </NSpace>

      <NEmpty v-else :description="$t('knowledge.selectKnowledge')" />

      <NModal v-model:show="showAddModal" :title="$t('knowledge.addRelationTitle')" preset="card" style="width: 500px">
        <NForm :model="addForm" label-placement="left" label-width="100">
          <NFormItem :label="$t('knowledge.targetKnowledge')">
            <NSelect
              v-model:value="addForm.targetId"
              :options="targetKnowledgeOptions"
              filterable
              :placeholder="$t('knowledge.selectTarget')"
            />
          </NFormItem>
          <NFormItem :label="$t('knowledge.relationType')">
            <NSelect v-model:value="addForm.type" :options="relationTypeOptions" />
          </NFormItem>
          <NFormItem :label="$t('knowledge.weight')">
            <NInputNumber v-model:value="addForm.weight" :min="0" :max="2" :step="0.1" style="width: 100%" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showAddModal = false">{{ $t('common.cancel') }}</NButton>
            <NButton type="primary" @click="handleAddRelation">{{ $t('common.confirm') }}</NButton>
          </NSpace>
        </template>
      </NModal>
    </NCard>
  </Page>
</template>
