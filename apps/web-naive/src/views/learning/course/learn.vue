<script lang="ts" setup>
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
import { getDocumentsByKnowledgeApi } from '#/api/knowledge/document';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const courseId = computed(() => Number(route.params.courseId));
const course = ref();
const allChapters = ref([]);
const currentChapter = ref(null);
const chapterDocuments = ref([]);
const chapterKnowledges = ref([]);
const completedChapterIds = ref(new Set());
const loading = ref(false);
const studentId = ref(0);
const docLoading = ref(false);
const showDocModal = ref(false);
const currentDoc = ref(null);
const sideCollapsed = ref(false);
const { getCurrentStudentId } = useCurrentStudentId();

const totalChapters = computed(() => allChapters.value.length);
const completedCount = computed(() => completedChapterIds.value.size);
const progressPercent = computed(() =>
  totalChapters.value > 0
    ? Math.round((completedCount.value / totalChapters.value) * 100)
    : 0,
);

function flattenChapterTree(nodes, result) {
  if (result === undefined) result = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length > 0) flattenChapterTree(node.children, result);
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
      var tree = await getChapterTree(course.value.textbookId);
      allChapters.value = flattenChapterTree(tree);
      if (allChapters.value.length > 0) selectChapter(allChapters.value[0]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function selectChapter(chapter) {
  currentChapter.value = chapter;
  docLoading.value = true;
  chapterDocuments.value = [];
  chapterKnowledges.value = [];
  try {
    var res = await fetch(
      '/edu/chapter/knowledge/list?chapterId=' + chapter.id,
    );
    var json = await res.json();
    var kIds = json?.data || [];
    if (kIds.length > 0) {
      var dPromises = kIds.map((id) =>
        fetch('/knowledge/knowledge/detail?id=' + id).then((r) => r.json()),
      );
      var details = await Promise.all(dPromises);
      chapterKnowledges.value = details.map((r) => r?.data).filter(Boolean);
      var docPs = kIds.map((id) =>
        getDocumentsByKnowledgeApi(id).then((d) => d || []),
      );
      var docRs = await Promise.all(docPs);
      var docMap = new Map();
      for (var docs of docRs) {
        for (var d of docs) {
          if (!docMap.has(d.id)) docMap.set(d.id, d);
        }
      }
      chapterDocuments.value = Array.from(docMap.values());
    }
  } catch (e) {
    console.error(e);
  } finally {
    docLoading.value = false;
  }
}

function getDocTypeIcon(type) {
  var m = {
    ARTICLE: '📄',
    TEXTBOOK: '📖',
    LECTURE: '🎓',
    REFERENCE: '📚',
    VIDEO: '🎬',
    EXERCISE: '✏',
  };
  return m[type] || '📄';
}

function openDocument(doc) {
  currentDoc.value = doc;
  showDocModal.value = true;
}

async function markChapterCompleted(chapter) {
  if (studentId.value && courseId.value) {
    try {
      for (var kid of chapterKnowledges.value.map((k) => k.id)) {
        await fetch(
          '/edu/course/record-study?studentId=' +
            studentId.value +
            '&courseId=' +
            courseId.value +
            '&chapterId=' +
            chapter.id +
            '&knowledgeId=' +
            kid,
          { method: 'POST' },
        );
      }
    } catch (e) {}
  }
  completedChapterIds.value.add(chapter.id);
  message.success(chapter.name + ' ' + $t('learning.alreadyCompleted'));
}

function isChapterCompleted(chapterId) {
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
    <div class="flex h-[calc(100vh-120px)] gap-0">
      <div v-show="!sideCollapsed" class="w-72 flex-shrink-0 border-r bg-white">
        <div class="border-b p-3 font-medium text-sm">
          {{ $t('learning.chapterDirectory') }}
          <span class="ml-2 text-xs text-gray-400">{{ completedCount }}/{{ totalChapters }}</span>
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
                  >{{ chapter.name }}</span>
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
                  @click="router.push(`/learning/knowledge/${ kg.id}`)"
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
      <div class="w-48 flex-shrink-0 border-l bg-white p-4">
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
      class="w-[800px]"
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
{{
          $t('learning.close')
        }}
</NButton>
</template>
    </NModal>
  </Page>
</template>
