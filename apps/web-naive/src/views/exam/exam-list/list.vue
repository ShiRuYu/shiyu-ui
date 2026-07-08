<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NGi, NGrid, NSpace, NTag } from 'naive-ui';

import { getExamBySubject } from '#/api';
import { getDictByType } from '#/api/common/dict';
import { $t } from '#/locales';

const router = useRouter();
const exams = ref<any[]>([]);
const loading = ref(false);

const typeMap = ref<Record<string, string>>({});

const typeColor: Record<string, any> = {
  DAILY_QUIZ: 'info',
  UNIT_TEST: 'success',
  MIDTERM: 'warning',
  FINAL: 'error',
  MOCK: 'default',
  AI_GENERATED: 'primary',
};

async function loadTypeMap() {
  try {
    const data = await getDictByType('EXAM_TYPE');
    typeMap.value = data.reduce((acc: Record<string, string>, d: any) => {
      acc[d.dictValue] = d.dictLabel;
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to load type map:', error);
  }
}

async function loadExams() {
  loading.value = true;
  try {
    exams.value = await getExamBySubject('MATH');
  } catch (error) {
    console.error('Failed to load exams:', error);
  } finally {
    loading.value = false;
  }
}

function startExam(exam: any) {
  router.push({ path: `/exam/take/${exam.id}` });
}

onMounted(() => {
  loadTypeMap();
  loadExams();
});
</script>

<template>
  <Page :title="$t('page.exam.list')">
    <NGrid :cols="3" :x-gap="16" :y-gap="16">
      <NGi v-for="exam in exams" :key="exam.id">
        <NCard hoverable>
          <template #header>
            <span class="text-base font-medium">{{ exam.name }}</span>
          </template>
          <template #header-extra>
            <NTag :type="typeColor[exam.type] || 'default'" size="small">
              {{ typeMap[exam.type] || exam.type }}
            </NTag>
          </template>

          <NSpace vertical class="text-sm text-gray-500">
            <span>{{ $t('education.course.subjectCode') }}:
              {{ exam.subjectCode }}</span>
            <span>{{ $t('education.course.grade') }}: {{ exam.grade }}</span>
            <span>{{ $t('education.exam.durationMin') }}:
              {{ exam.durationMin }}</span>
            <span>{{ $t('education.exam.totalScore') }}:
              {{ exam.totalScore }}</span>
            <NTag
              :type="exam.status === 1 ? 'success' : 'default'"
              size="small"
            >
              {{ exam.status === 1 ? '进行中' : '已结束' }}
            </NTag>
          </NSpace>

          <template #footer>
            <NButton type="primary" block @click="startExam(exam)">
              开始考试
            </NButton>
          </template>
        </NCard>
      </NGi>
    </NGrid>

    <div
      v-if="!loading && exams.length === 0"
      class="py-20 text-center text-gray-400"
    >
      暂无考试
    </div>
  </Page>
</template>
