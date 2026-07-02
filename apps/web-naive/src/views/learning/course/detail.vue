<script lang="ts" setup>
import type { EducationChapterApi } from '#/api/education/chapter';
import type { EducationCourseApi } from '#/api/education/course';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NSpace,
  NTag,
  NTree,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { getChapterTree, getCourseById, startLearning } from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const course = ref<EducationCourseApi.Course>();
const chapters = ref<EducationChapterApi.Chapter[]>([]);
const loading = ref(false);

async function loadCourse() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    course.value = await getCourseById(id);
  } catch (error) {
    console.error('Failed to load course:', error);
  } finally {
    loading.value = false;
  }
}

async function loadChapters() {
  if (!course.value?.textbookId) return;
  try {
    chapters.value = await getChapterTree(course.value.textbookId);
  } catch (error) {
    console.error('Failed to load chapters:', error);
  }
}

async function handleStartLearning() {
  if (!course.value) return;
  try {
    await startLearning(course.value.id, 1);
    message.success($t('ui.actionMessage.operationSuccess'));
  } catch (error) {
    console.error('Failed to start learning:', error);
  }
}

onMounted(() => {
  loadCourse();
  loadChapters();
});
</script>

<template>
  <Page :title="course?.name || $t('page.learning.courseDetail')">
    <template #extra>
      <NButton @click="router.back()">
        {{ $t('common.back') }}
      </NButton>
    </template>

    <div class="grid grid-cols-3 gap-4">
      <NCard class="col-span-2" :title="$t('education.course.title')">
        <NDescriptions v-if="course" label-placement="left" bordered>
          <NDescriptionsItem :label="$t('education.course.name')">
            {{ course.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.subjectCode')">
            <NTag type="info">{{ course.subjectCode }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.grade')">
            {{ course.grade }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.totalHours')">
            {{ course.totalHours }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.course.description')">
            {{ course.description || '-' }}
          </NDescriptionsItem>
        </NDescriptions>

        <NSpace class="mt-4">
          <NButton type="primary" @click="handleStartLearning">
            {{ $t('education.course.startLearning') }}
          </NButton>
        </NSpace>
      </NCard>

      <NCard :title="$t('education.chapter.title')">
        <NTree
          v-if="chapters.length > 0"
          :data="chapters as any"
          key-field="id"
          label-field="name"
          children-field="children"
          default-expand-all
        />
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NCard>
    </div>
  </Page>
</template>
