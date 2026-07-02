<script lang="ts" setup>
import type { EducationCourseApi } from '#/api/education/course';
import type { EducationSubjectApi } from '#/api/education/subject';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NCard,
  NGi,
  NGrid,
  NInputNumber,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui';

import { getCourseList, getSubjectList } from '#/api';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const courses = ref<EducationCourseApi.Course[]>([]);
const subjects = ref<EducationSubjectApi.Subject[]>([]);

const filterSubject = ref<null | string>(null);
const filterGrade = ref<null | number>(null);

async function loadSubjects() {
  try {
    subjects.value = await getSubjectList();
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function loadCourses() {
  loading.value = true;
  try {
    let data = await getCourseList();
    if (filterSubject.value) {
      data = data.filter((c) => c.subjectCode === filterSubject.value);
    }
    if (filterGrade.value) {
      data = data.filter((c) => c.grade === filterGrade.value);
    }
    courses.value = data;
  } catch (error) {
    console.error('Failed to load courses:', error);
  } finally {
    loading.value = false;
  }
}

function goToCourse(course: EducationCourseApi.Course) {
  router.push({ path: `/learning/course/${course.id}` });
}

onMounted(() => {
  loadSubjects();
  loadCourses();
});
</script>

<template>
  <Page :title="$t('page.learning.course')">
    <template #extra>
      <NSpace>
        <NSelect
          v-model:value="filterSubject"
          :options="subjects.map((s) => ({ label: s.name, value: s.code }))"
          :placeholder="$t('education.course.subjectCode')"
          clearable
          style="width: 150px"
          @update:value="loadCourses"
        />
        <NInputNumber
          v-model:value="filterGrade"
          :placeholder="$t('education.course.grade')"
          clearable
          style="width: 120px"
          @update:value="loadCourses"
        />
      </NSpace>
    </template>

    <NGrid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
      <NGi v-for="course in courses" :key="course.id">
        <NCard hoverable class="cursor-pointer" @click="goToCourse(course)">
          <template #cover>
            <div
              v-if="course.coverUrl"
              class="h-40 w-full bg-cover bg-center"
              :style="{ backgroundImage: `url(${course.coverUrl})` }"
            ></div>
            <div
              v-else
              class="flex h-40 w-full items-center justify-center bg-gray-100"
            >
              <span class="text-4xl text-gray-300">📚</span>
            </div>
          </template>
          <template #header>
            <span class="line-clamp-1 text-base font-medium">{{
              course.name
            }}</span>
          </template>
          <template #header-extra>
            <NTag :bordered="false" size="small" type="info">
              {{ course.subjectCode }}
            </NTag>
          </template>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ $t('education.course.grade') }}: {{ course.grade }}</span>
            <span>{{ $t('education.course.totalHours') }}:
              {{ course.totalHours }}</span>
          </div>
          <div
            v-if="course.description"
            class="mt-2 line-clamp-2 text-sm text-gray-400"
          >
            {{ course.description }}
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <div
      v-if="!loading && courses.length === 0"
      class="py-20 text-center text-gray-400"
    >
      {{ $t('common.noData') }}
    </div>
  </Page>
</template>
