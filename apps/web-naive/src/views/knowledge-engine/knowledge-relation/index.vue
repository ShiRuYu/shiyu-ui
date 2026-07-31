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
  createKnowledgeRelation,
  deleteKnowledgeRelation,
  getKnowledgeRelations,
} from '#/api/knowledge/relation';
import { getKnowledgePoints } from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';
import { $t } from '#/locales';
import { storeToRefs } from 'pinia';

const message = useMessage();
const knowledgeStore = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(knowledgeStore);
const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedKnowledgeId = ref<null | number>(null);
const prerequisites = ref<any[]>([]);
const subsequent = ref<any[]>([]);
const loading = ref(false);
const showAddModal = ref(false);
const addForm = ref({
  targetId: null as null | number,
  type: 'PRE',
  weight: 1,
});

const relationTypeOptions = computed(() => [
  { label: `${$t('knowledge.relationPre')} (PRE)`, value: 'PRE' },
]);

const targetKnowledgeOptions = computed(() => {
  return knowledgeOptions.value.filter(
    (opt) => opt.value !== selectedKnowledgeId.value,
  );
});

async function loadOptions() {
  if (!activeSpaceId.value) return;
  const result = await getKnowledgePoints(activeSpaceId.value, {
    pageNum: 1,
    pageSize: 1000,
  });
  knowledgeOptions.value = result.items.map((k) => ({
    label: `[${k.code}] ${k.name}`,
    value: k.id,
  }));
}

async function loadRelations() {
  if (!selectedKnowledgeId.value) return;
  loading.value = true;
  try {
    const relations = await getKnowledgeRelations(selectedKnowledgeId.value);
    prerequisites.value = relations
      .filter(
        (item) =>
          item.relationType === 'PRE' &&
          item.sourceId === selectedKnowledgeId.value,
      )
      .map((item) => item.target)
      .filter(Boolean);
    subsequent.value = relations
      .filter(
        (item) =>
          item.relationType === 'PRE' &&
          item.targetId === selectedKnowledgeId.value,
      )
      .map((item) => item.source)
      .filter(Boolean);
  } finally {
    loading.value = false;
  }
}

async function handleAddRelation() {
  if (!selectedKnowledgeId.value || !addForm.value.targetId) return;
  try {
    await createKnowledgeRelation({
      sourceId: selectedKnowledgeId.value,
      targetId: addForm.value.targetId,
      type: addForm.value.type,
      weight: addForm.value.weight,
    });
    message.success($t('knowledge.relationAdded'));
    showAddModal.value = false;
    addForm.value = { targetId: null, type: 'PRE', weight: 1 };
    await loadRelations();
  } catch (error: any) {
    message.error(error.message || $t('knowledge.addFailed'));
  }
}

async function handleDeleteRelation(targetId: number, isPre: boolean) {
  if (!selectedKnowledgeId.value) return;
  const sourceId = isPre ? selectedKnowledgeId.value : targetId;
  const relationTargetId = isPre ? targetId : selectedKnowledgeId.value;
  await deleteKnowledgeRelation(sourceId, relationTargetId, 'PRE');
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
          onPositiveClick: () => handleDeleteRelation(row.id, true),
        },
        {
          default: () => $t('knowledge.confirmDelete'),
          trigger: () =>
            h(
              NButton,
              { size: 'small', type: 'error' },
              $t('knowledge.release'),
            ),
        },
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
    render: () => h(NTag, { size: 'small' }, 'PRE'),
  },
  {
    title: $t('common.operation'),
    key: 'actions',
    width: 100,
    render: (row: any) =>
      h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDeleteRelation(row.id, false),
        },
        {
          default: () => $t('knowledge.confirmDelete'),
          trigger: () =>
            h(
              NButton,
              { size: 'small', type: 'error' },
              $t('knowledge.release'),
            ),
        },
      ),
  },
]);

onMounted(async () => {
  await knowledgeStore.loadSpaces();
  await loadOptions();
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
          <NButton
            v-if="selectedKnowledgeId"
            type="primary"
            @click="showAddModal = true"
          >
            {{ $t('knowledge.addRelation') }}
          </NButton>
        </NSpace>
      </template>

      <NSpace v-if="selectedKnowledgeId" vertical>
        <h4>{{ $t('knowledge.prerequisiteKnowledge') }}</h4>
        <NDataTable
          :columns="preColumns"
          :data="prerequisites"
          :loading="loading"
          size="small"
          striped
        />

        <h4 class="mt-4">{{ $t('knowledge.subsequentKnowledge') }}</h4>
        <NDataTable
          :columns="subColumns"
          :data="subsequent"
          :loading="loading"
          size="small"
          striped
        />
      </NSpace>

      <NEmpty v-else :description="$t('knowledge.selectKnowledge')" />

      <NModal
        v-model:show="showAddModal"
        :title="$t('knowledge.addRelationTitle')"
        preset="card"
        style="width: 500px"
      >
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
            <NSelect
              v-model:value="addForm.type"
              :options="relationTypeOptions"
            />
          </NFormItem>
          <NFormItem :label="$t('knowledge.weight')">
            <NInputNumber
              v-model:value="addForm.weight"
              :min="0"
              :max="2"
              :step="0.1"
              style="width: 100%"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace justify="end">
            <NButton @click="showAddModal = false">
              {{ $t('common.cancel') }}
            </NButton>
            <NButton type="primary" @click="handleAddRelation">
              {{ $t('common.confirm') }}
            </NButton>
          </NSpace>
        </template>
      </NModal>
    </NCard>
  </Page>
</template>
