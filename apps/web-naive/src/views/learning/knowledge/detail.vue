<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NModal,
  NSpin,
  NStep,
  NSteps,
  NTag,
} from 'naive-ui';

import {
  getKnowledgeDocument,
} from '#/api/knowledge/enterprise';
import {
  getKnowledgePoint,
  getKnowledgePointGraph,
  getKnowledgePointPath,
} from '#/api/knowledge/point';
import { getKnowledgeDocumentsByPoint } from '#/api/knowledge/document';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();

interface KnowledgeDocument {
  content?: string;
  docType: string;
  id: number;
  title: string;
}

interface KnowledgePathItem {
  id: number;
  mastered: boolean;
  name: string;
}

interface KnowledgePath {
  path: KnowledgePathItem[];
}

const knowledge = ref<Record<string, any>>();
const graph = ref<Record<string, any>>();
const path = ref<KnowledgePath>();
const documents = ref<KnowledgeDocument[]>([]);
const loading = ref(false);
const docLoading = ref(false);
const showDocModal = ref(false);
const currentDoc = ref<KnowledgeDocument>();

async function loadData() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    knowledge.value = await getKnowledgePoint(id);
    documents.value =
      ((await getKnowledgeDocumentsByPoint(id)) as KnowledgeDocument[]) || [];
    graph.value = await getKnowledgePointGraph(id);
    const pathIds = await getKnowledgePointPath(id);
    const pathPoints = await Promise.all(
      pathIds.map((pointId) => getKnowledgePoint(pointId)),
    );
    path.value = {
      path: pathPoints.map((item) => ({
        id: item.id,
        mastered: false,
        name: item.name,
      })),
    };
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function openDocument(d: KnowledgeDocument) {
  const detail = await getKnowledgeDocument(d.id);
  Object.assign(d, detail);
  currentDoc.value = d;
  showDocModal.value = true;
}
function getDocTypeIcon(type: string) {
  const icons: Record<string, string> = {
    ARTICLE: '📄',
    LECTURE: '🎓',
    REFERENCE: '📚',
    TEXTBOOK: '📖',
  };
  return icons[type] || '📄';
}

onMounted(() => {
  loadData();
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
            <NTag type="info">
              {{ knowledge.subjectCode }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.grade')">
            {{ knowledge.grade }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.question.difficulty')">
            <NTag :type="knowledge.difficulty <= 2 ? 'success' : 'warning'">
              {{ knowledge.difficulty }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('knowledge.description')">
            {{ knowledge.description }}
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
            <NTag :type="item.mastered ? 'success' : 'warning'" size="small">
              {{
                item.mastered
                  ? $t('learning.mastered')
                  : $t('learning.notMastered')
              }}
            </NTag>
          </NStep>
        </NSteps>
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NCard>
    </div>
    <NCard class="mt-4" :title="$t('learning.learningMaterials')">
      <NSpin :show="docLoading">
        <div v-if="documents.length > 0" class="grid grid-cols-3 gap-3">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="cursor-pointer rounded-lg border p-3 transition-all hover:border-blue-300 hover:shadow-sm"
            @click="openDocument(doc)"
          >
            <div class="mb-1 text-2xl">{{ getDocTypeIcon(doc.docType) }}</div>
            <div class="truncate text-sm font-medium">{{ doc.title }}</div>
          </div>
        </div>
        <NEmpty v-else :description="$t('learning.noDocuments')" />
      </NSpin>
    </NCard>
    <NModal
      v-model:show="showDocModal"
      :title="currentDoc?.title || $t('learning.document')"
      preset="card"
      class="w-[800px]"
      style="max-height: 80vh"
      :bordered="false"
    >
      <div class="overflow-y-auto p-4" style="max-height: 60vh">
        <div v-if="currentDoc?.content" class="whitespace-pre-wrap text-sm">
          {{ currentDoc.content }}
        </div>
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('learning.noContent') }}
        </div>
      </div>
      <template #footer>
        <NButton @click="showDocModal = false">
          {{ $t('learning.close') }}
        </NButton>
      </template>
    </NModal>
  </Page>
</template>
