<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NEmpty, NSpin, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  type EducationCourseApi,
  getStudentCourseDetail,
} from '#/features/education';

const route = useRoute();
const router = useRouter();
const detail = ref<EducationCourseApi.CourseDetail | null>(null);
const loading = ref(false);

onMounted(async () => {
  const id = Number(route.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  loading.value = true;
  try {
    detail.value = await getStudentCourseDetail(id);
  } catch (error) {
    console.error(error);
    message.error('课程加载失败');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page :title="detail?.course.name || '课程详情'">
    <template #extra>
      <NButton @click="router.back()">返回课程</NButton>
    </template>
    <NSpin :show="loading">
      <NCard v-if="detail">
        <div class="mb-3">{{ detail.course.description }}</div>
        <NTag>
          {{ detail.course.subjectCode }} · {{ detail.course.grade }} 年级
        </NTag>
      </NCard>
      <NCard
        v-for="chapter in detail?.chapters || []"
        :key="chapter.id"
        class="mt-4"
        :title="chapter.name"
      >
        <div v-for="section in chapter.sections" :key="section.id" class="py-2">
          {{ section.name }} · {{ section.durationMin }} 分钟
        </div>
        <NEmpty
          v-if="chapter.sections.length === 0"
          description="本章暂无小节"
        />
      </NCard>
      <NEmpty v-if="!loading && !detail" description="课程不可用" />
    </NSpin>
  </Page>
</template>
