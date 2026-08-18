<script lang="ts" setup>
import type { EducationChapterApi } from '#/api/education/chapter';
import type { EducationCourseApi } from '#/api/education/course';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabbarStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NEmpty,
  NModal,
  NProgress,
  NScrollbar,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { getChapterTree } from '#/api/education/chapter';
import { getCourseById } from '#/api/education/course';
import { getKnowledgeDocumentsByPoint } from '#/api/knowledge/document';
import { getKnowledgeDocument } from '#/api/knowledge/enterprise';
import { getKnowledgePoint } from '#/api/knowledge/point';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const courseId = computed(() => Number(route.params.courseId));

interface KnowledgeDocument {
  content?: string;
  docType: string;
  id: number;
  title: string;
}

interface KnowledgeSummary {
  id: number;
  name: string;
}

const course = ref<EducationCourseApi.Course>();
const allChapters = ref<EducationChapterApi.Chapter[]>([]);
const currentChapter = ref<EducationChapterApi.Chapter>();
const chapterDocuments = ref<KnowledgeDocument[]>([]);
const chapterKnowledges = ref<KnowledgeSummary[]>([]);
const completedChapterIds = ref(new Set<number>());
const loading = ref(false);
const studentId = ref(0);
const docLoading = ref(false);
const showDocModal = ref(false);
const currentDoc = ref<KnowledgeDocument>();
const sideCollapsed = ref(false);
const { getCurrentStudentId } = useCurrentStudentId();

const totalChapters = computed(() => allChapters.value.length);
const completedCount = computed(() => completedChapterIds.value.size);
const progressPercent = computed(() =>
  totalChapters.value > 0
    ? Math.round((completedCount.value / totalChapters.value) * 100)
    : 0,
);

function flattenChapterTree(
  nodes: EducationChapterApi.Chapter[],
  result: EducationChapterApi.Chapter[] = [],
) {
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) flattenChapterTree(node.children, result);
  }
  return result;
}

async function loadCourse() {
  if (!courseId.value) return;
  loading.value = true;
  try {
    course.value = await getCourseById(courseId.value);
    if (course.value?.name) {
      const ts = useTabbarStore();
      const tk = ts.getTabs.find((t) => t.name === 'LearningCourseLearn');
      if (tk) {
        tk.meta.title = course.value.name;
        ts.setUpdateTime();
      }
    }
    if (course.value?.textbookId) {
      const tree = await getChapterTree(course.value.textbookId);
      allChapters.value = flattenChapterTree(tree);
      const firstChapter = allChapters.value[0];
      if (firstChapter) selectChapter(firstChapter);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

async function selectChapter(chapter: EducationChapterApi.Chapter) {
  currentChapter.value = chapter;
  docLoading.value = true;
  chapterDocuments.value = [];
  chapterKnowledges.value = [];
  try {
    const res = await fetch(
      `/v1/education/chapter/knowledge/list?chapterId=${chapter.id}`,
    );
    const json = (await res.json()) as { data?: number[] };
    const kIds = json.data ?? [];
    if (kIds.length > 0) {
      const details = await Promise.all(
        kIds.map((id) => getKnowledgePoint(id)),
      );
      chapterKnowledges.value = details.map((item) => ({
        id: item.id,
        name: item.name,
      }));
      const docPs = kIds.map((id: number) =>
        getKnowledgeDocumentsByPoint(id).then(
          (documents) => (documents || []) as KnowledgeDocument[],
        ),
      );
      const docRs = await Promise.all(docPs);
      const docMap = new Map<number, KnowledgeDocument>();
      for (const docs of docRs) {
        for (const d of docs) {
          if (!docMap.has(d.id)) docMap.set(d.id, d);
        }
      }
      chapterDocuments.value = [...docMap.values()];
    }
  } catch (error) {
    console.error(error);
  } finally {
    docLoading.value = false;
  }
}

function getDocTypeIcon(type: string) {
  const icons: Record<string, string> = {
    ARTICLE: '📄',
    TEXTBOOK: '📖',
    LECTURE: '🎓',
    REFERENCE: '📚',
    VIDEO: '🎬',
    EXERCISE: '✏',
  };
  return icons[type] || '📄';
}

async function openDocument(doc: KnowledgeDocument) {
  const detail = await getKnowledgeDocument(doc.id);
  Object.assign(doc, detail);
  currentDoc.value = doc;
  showDocModal.value = true;
}

async function markChapterCompleted(chapter: EducationChapterApi.Chapter) {
  if (studentId.value && courseId.value) {
    try {
      for (const kid of chapterKnowledges.value.map((k) => k.id)) {
        await fetch(
          `/v1/education/course/record-study?studentId=${studentId.value}&courseId=${
            courseId.value
          }&chapterId=${chapter.id}&knowledgeId=${kid}`,
          { method: 'POST' },
        );
      }
    } catch (error) {
      console.error('Failed to record study progress:', error);
    }
  }
  completedChapterIds.value.add(chapter.id);
  message.success(`${chapter.name} ${$t('learning.alreadyCompleted')}`);
}

function isChapterCompleted(chapterId: number) {
  return completedChapterIds.value.has(chapterId);
}

onMounted(() => {
  studentId.value = getCurrentStudentId();
  loadCourse();
});
</script>
<template>
  <Page
    :title="course?.name || $t('page.learning.courseDetail')"
    content-class="!p-0"
  >
    <template #extra>
      <NSpace>
        <NButton size="small" @click="sideCollapsed = !sideCollapsed">
          {{ sideCollapsed ? $t('learning.expand') : $t('learning.collapse') }}
        </NButton>
        <NButton @click="router.back()">{{ $t('common.back') }}</NButton>
      </NSpace>
    </template>
    <div class="course-learning-layout flex min-h-[calc(100vh-120px)] gap-0">
      <div
        v-show="!sideCollapsed"
        class="course-learning-sidebar w-72 flex-shrink-0 border-r bg-white"
      >
        <div class="border-b p-3 font-medium text-sm">
          {{ $t('learning.chapterDirectory') }}
          <span class="ml-2 text-xs text-gray-400"
            >{{ completedCount }}/{{ totalChapters }}</span
          >
        </div>
        <NScrollbar style="height: calc(100% - 44px)">
          <div class="p-2">
            <div
              v-for="chapter in allChapters"
              :key="chapter.id"
              class="mb-1 cursor-pointer rounded-lg p-2 transition-all"
              :class="{
                'bg-blue-50 text-blue-600': currentChapter?.id === chapter.id,
                'hover:bg-gray-50': currentChapter?.id !== chapter.id,
              }"
              @click="selectChapter(chapter)"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs"
                  :class="
                    isChapterCompleted(chapter.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  "
                >
                  {{
                    isChapterCompleted(chapter.id)
                      ? '✓'
                      : chapter.chapterOrder || '•'
                  }}
                </span>
                <span
                  class="flex-1 truncate text-sm"
                  :class="
                    isChapterCompleted(chapter.id) ? 'text-green-600' : ''
                  "
                  >{{ chapter.name }}</span
                >
              </div>
            </div>
          </div>
        </NScrollbar>
      </div>
      <div class="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div
          v-if="!currentChapter"
          class="flex h-full items-center justify-center text-gray-400"
        >
          <NEmpty :description="$t('learning.selectChapterHint')" />
        </div>
        <template v-else>
          <div class="mb-6">
            <h2 class="text-xl font-bold">{{ currentChapter.name }}</h2>
          </div>
          <NCard
            :title="$t('learning.knowledgePoints')"
            class="mb-4"
            size="small"
          >
            <NSpin :show="docLoading">
              <div
                v-if="chapterKnowledges.length > 0"
                class="flex flex-wrap gap-2"
              >
                <NTag
                  v-for="kg in chapterKnowledges"
                  :key="kg.id"
                  :bordered="false"
                  type="info"
                  class="cursor-pointer"
                  @click="
                    router.push({
                      path: '/education-center/learning',
                      query: { knowledgeId: String(kg.id) },
                    })
                  "
                >
                  {{ kg.name }}
                </NTag>
              </div>
              <div v-else class="text-sm text-gray-400">
                {{ $t('common.noData') }}
              </div>
            </NSpin>
          </NCard>
          <NCard
            :title="$t('learning.learningMaterials')"
            class="mb-4"
            size="small"
          >
            <NSpin :show="docLoading">
              <div
                v-if="chapterDocuments.length > 0"
                class="grid grid-cols-2 gap-3"
              >
                <div
                  v-for="doc in chapterDocuments"
                  :key="doc.id"
                  class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all hover:border-blue-300 hover:shadow-sm"
                  @click="openDocument(doc)"
                >
                  <span class="text-2xl">{{
                    getDocTypeIcon(doc.docType)
                  }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="truncate text-sm font-medium">
                      {{ doc.title }}
                    </div>
                    <div class="mt-0.5 text-xs text-gray-400">
                      {{ doc.docType }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-400">
                {{ $t('learning.noDocuments') }}
              </div>
            </NSpin>
          </NCard>
          <div class="mt-6 flex gap-3">
            <NButton
              type="primary"
              size="large"
              :disabled="isChapterCompleted(currentChapter.id)"
              @click="markChapterCompleted(currentChapter)"
            >
              {{
                isChapterCompleted(currentChapter.id)
                  ? $t('learning.alreadyCompleted')
                  : $t('learning.markCompleted')
              }}
            </NButton>
          </div>
        </template>
      </div>
      <div
        class="course-learning-progress w-48 flex-shrink-0 border-l bg-white p-4"
      >
        <h3 class="mb-3 text-sm font-medium">{{ $t('learning.progress') }}</h3>
        <NProgress
          type="circle"
          :percentage="progressPercent"
          :stroke-width="8"
          :size="100"
        />
        <div class="mt-3 text-center text-sm text-gray-500">
          {{ completedCount }} / {{ totalChapters }}
          {{ $t('learning.chapterUnits') }}
        </div>
      </div>
    </div>
    <NModal
      v-model:show="showDocModal"
      :title="currentDoc?.title || $t('learning.document')"
      preset="card"
      class="w-[94vw] max-w-[800px]"
      style="max-height: 80vh"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <div class="overflow-y-auto p-4" style="max-height: 60vh">
        <div
          v-if="currentDoc?.content"
          class="whitespace-pre-wrap text-sm leading-relaxed"
        >
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

<style scoped>
@media (max-width: 767px) {
  .course-learning-layout {
    flex-direction: column;
  }

  .course-learning-sidebar,
  .course-learning-progress {
    width: 100%;
    border-right: 0;
    border-left: 0;
  }

  .course-learning-progress {
    border-top: 1px solid var(--border);
  }
}
</style>
