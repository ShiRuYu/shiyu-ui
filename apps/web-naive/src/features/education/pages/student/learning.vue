<script lang="ts" setup>
import type { EducationCourseApi } from '#/features/education';
import type { EducationSubjectApi } from '#/features/education';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NCard,
  NGi,
  NGrid,
  NInputNumber,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { getCourseList, getSubjectList } from '#/features/education';
import { $t } from '#/locales';
import { EducationAdminCoursePage as AdminCourseList } from '#/features/education';

const accessStore = useAccessStore();
const router = useRouter();
const loading = ref(false);
const courses = ref<EducationCourseApi.Course[]>([]);
const subjects = ref<EducationSubjectApi.Subject[]>([]);
const activeTab = ref('student');
const adminPermission = accessStore.accessCodes.includes('edu:course:list');

const filterSubject = ref<null | string>(null);
const filterGrade = ref<null | number>(null);

async function loadSubjects() {
  try {
    const result = await getSubjectList();
    subjects.value = result?.items || result || [];
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function loadCourses() {
  loading.value = true;
  try {
    const result = await getCourseList();
    let data = result?.items || result || [];
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
  router.push({
    path: '/education-center/learning',
    query: { courseId: String(course.id) },
  });
}

onMounted(() => {
  loadSubjects();
  loadCourses();
});
</script>

<template>
  <Page>
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 学生端：课程浏览 -->
      <NTabPane name="student" :tab="$t('page.learning.course')">
        <NSpace class="mb-4" justify="end">
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

        <NGrid cols="1 s:2 m:3 l:4" :x-gap="16" :y-gap="16" responsive="screen">
          <NGi v-for="course in courses" :key="course.id">
            <NCard
              hoverable
              class="cursor-pointer focus-visible:outline focus-visible:outline-2"
              role="link"
              tabindex="0"
              @click="goToCourse(course)"
              @keydown.enter.prevent="goToCourse(course)"
              @keydown.space.prevent="goToCourse(course)"
            >
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
              <div
                class="flex items-center justify-between text-sm text-gray-500"
              >
                <span
                  >{{ $t('education.course.grade') }}: {{ course.grade }}</span
                >
                <span
                  >{{ $t('education.course.totalHours') }}:
                  {{ course.totalHours }}</span
                >
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
      </NTabPane>

      <!-- 管理端：课程管理 -->
      <NTabPane
        v-if="adminPermission"
        name="admin"
        :tab="$t('page.eduAdmin.course')"
      >
        <AdminCourseList />
      </NTabPane>
    </NTabs>
  </Page>
</template>
