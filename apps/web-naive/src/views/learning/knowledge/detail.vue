<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NStep,
  NSteps,
  NTag,
} from 'naive-ui';

import {
  getKnowledgeDetailApi,
  getKnowledgeGraphApi,
  getKnowledgePathApi,
} from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const knowledge = ref<any>();
const graph = ref<any>();
const path = ref<any>();
const loading = ref(false);

async function loadKnowledge() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    knowledge.value = await getKnowledgeDetailApi(id);
  } catch (error) {
    console.error('Failed to load knowledge:', error);
  } finally {
    loading.value = false;
  }
}

async function loadGraph() {
  const id = Number(route.params.id);
  if (!id) return;
  try {
    graph.value = await getKnowledgeGraphApi(id);
  } catch (error) {
    console.error('Failed to load graph:', error);
  }
}

async function loadPath() {
  const id = Number(route.params.id);
  if (!id) return;
  try {
    path.value = await getKnowledgePathApi(id);
  } catch (error) {
    console.error('Failed to load path:', error);
  }
}

onMounted(() => {
  loadKnowledge();
  loadGraph();
  loadPath();
});
</script>

<template>
  <Page :title="knowledge?.name || $t('page.learning.knowledgeDetail')">
    <template #extra>
      <NButton @click="router.back()">
        {{ $t('common.back') }}
      </NButton>
    </template>

    <div class="grid grid-cols-2 gap-4">
      <NCard :title="$t('knowledge.name')">
        <NDescriptions v-if="knowledge" label-placement="left" bordered>
          <NDescriptionsItem :label="$t('knowledge.name')">
            {{ knowledge.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('knowledge.code')">
            {{ knowledge.code }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.subjectCode')">
            <NTag type="info">{{ knowledge.subjectCode }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.grade')">
            {{ knowledge.grade }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.question.difficulty')">
            <NTag :type="knowledge.difficulty <= 2 ? 'success' : 'warning'">
              {{ knowledge.difficulty }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('knowledge.estimatedTime')">
            {{ knowledge.estimatedTime }} min
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('knowledge.description')">
            {{ knowledge.description || '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <NCard :title="$t('learning.learningPath')">
        <NSteps v-if="path?.path?.length" vertical>
          <NStep
            v-for="item in path.path"
            :key="item.id"
            :title="item.name"
            :status="item.mastered ? 'finish' : 'process'"
          >
            <template v-if="item.mastered">
              <NTag type="success" size="small">
{{
                $t('learning.mastered')
              }}
</NTag>
            </template>
            <template v-else>
              <NTag type="warning" size="small">
{{
                $t('learning.notMastered')
              }}
</NTag>
            </template>
          </NStep>
        </NSteps>
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NCard>
    </div>

    <NCard class="mt-4" :title="$t('knowledge.viewGraph')">
      <div v-if="graph?.nodes?.length" class="text-center text-gray-500">
        <p>
          {{ graph.nodes.length }} nodes, {{ graph.edges?.length || 0 }} edges
        </p>
        <p class="text-sm text-gray-400">
          (Graph visualization component placeholder)
        </p>
      </div>
      <div v-else class="py-8 text-center text-gray-400">
        {{ $t('common.noData') }}
      </div>
    </NCard>
  </Page>
</template>
