<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { h } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { NButton, NDataTable, NTabPane, NTabs, NTag } from 'naive-ui';

import { getWrongQuestionsByStudent } from '#/api';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';
import AdminWrongQuestionList from '#/views/education-admin/wrong-question/list.vue';

const accessStore = useAccessStore();
const loading = ref(false);
const wrongQuestions = ref<any[]>([]);
const activeTab = ref('student');
const adminPermission = accessStore.accessCodes.includes('edu:wrong-question');
const { getCurrentStudentId } = useCurrentStudentId();

const columns: any[] = [
  { title: '题目ID', key: 'questionId', width: 80 },
  { title: '知识点ID', key: 'knowledgeId', width: 100 },
  { title: '我的答案', key: 'studentAnswer', width: 120 },
  {
    title: '正确次数',
    key: 'correctTimes',
    width: 100,
    render(row: any) {
      const color = row.correctTimes >= 2 ? 'success' : 'warning';
      return h(NTag, { type: color, size: 'small' }, () =>
        String(row.correctTimes),
      );
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    render() {
      return h(NButton, { size: 'small', type: 'primary' }, () => '重新练习');
    },
  },
];

async function loadWrongQuestions() {
  loading.value = true;
  try {
    wrongQuestions.value = await getWrongQuestionsByStudent(
      getCurrentStudentId(),
    );
  } catch (error) {
    console.error('Failed to load wrong questions:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWrongQuestions();
});
</script>

<template>
  <Page>
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 学生端：我的错题 -->
      <NTabPane name="student" :tab="$t('page.practice.wrong')">
        <NDataTable
          :columns="columns"
          :data="wrongQuestions"
          :loading="loading"
          striped
          :row-key="(row: any) => row.id"
        />
      </NTabPane>

      <!-- 管理端：错题管理 -->
      <NTabPane
        v-if="adminPermission"
        name="admin"
        :tab="$t('page.eduAdmin.wrongQuestion')"
      >
        <AdminWrongQuestionList />
      </NTabPane>
    </NTabs>
  </Page>
</template>
