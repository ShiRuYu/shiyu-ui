<script lang="ts" setup>
import type { EducationReviewApi } from '#/api/education-admin/review';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NGi,
  NGrid,
  NProgress,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import { completeReview, getTodayReviews } from '#/api/education-admin/review';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';
import AdminReviewList from '#/views/education-admin/review/list.vue';

const accessStore = useAccessStore();
const loading = ref(false);
const reviews = ref<EducationReviewApi.ReviewTask[]>([]);
const activeTab = ref('student');
const adminPermission = accessStore.accessCodes.includes('edu:review:list');
const { getCurrentStudentId } = useCurrentStudentId();

async function loadReviews() {
  loading.value = true;
  try {
    reviews.value = await getTodayReviews(getCurrentStudentId());
  } catch (error) {
    console.error('Failed to load reviews:', error);
  } finally {
    loading.value = false;
  }
}

async function handleComplete(review: EducationReviewApi.ReviewTask) {
  try {
    await completeReview(review.id, {
      studentId: getCurrentStudentId(),
      resultScore: 80,
    });
    review.status = 2; /* COMPLETED */
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => loadReviews());
</script>

<template>
  <Page>
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 学生端：今日复习 -->
      <NTabPane name="student" :tab="$t('page.review.today')">
        <NGrid cols="1 s:2" responsive="screen" :x-gap="16" :y-gap="16">
          <NGi v-for="review in reviews" :key="review.id">
            <NCard>
              <template #header>
                <NSpace>
                  <span class="text-base font-medium">{{
                    review.knowledgeName ||
                    `${$t('knowledge.name')} #${review.knowledgeId}`
                  }}</span>
                  <NTag type="warning" size="small">
                    {{ $t('education.review.round', [review.reviewRound]) }}
                  </NTag>
                </NSpace>
              </template>

              <NSpace vertical class="text-sm text-gray-500">
                <span
                  >{{ $t('education.review.reviewDate') }}:
                  {{ review.reviewDate }}</span
                >
                <span>
                  {{ $t('common.status') }}:
                  <NTag
                    :type="
                      review.status === 0 /* PENDING */ ? 'warning' : 'success'
                    "
                    size="small"
                  >
                    {{
                      $t(
                        `education.review.status${review.status === 0 /* PENDING */ ? 'Pending' : 'Completed'}`,
                      )
                    }}
                  </NTag>
                </span>
                <NProgress
                  v-if="review.resultScore"
                  type="line"
                  :percentage="review.resultScore"
                  :show-indicator="true"
                />
              </NSpace>

              <template #footer>
                <NButton
                  v-if="review.status === 0 /* PENDING */"
                  type="primary"
                  block
                  @click="handleComplete(review)"
                >
                  {{ $t('education.review.complete') }}
                </NButton>
              </template>
            </NCard>
          </NGi>
        </NGrid>

        <div
          v-if="!loading && reviews.length === 0"
          class="py-20 text-center text-gray-400"
        >
          {{ $t('education.review.noTasks') }}
        </div>
      </NTabPane>

      <!-- 管理端：复习任务管理 -->
      <NTabPane
        v-if="adminPermission"
        name="admin"
        :tab="$t('page.eduAdmin.review')"
      >
        <AdminReviewList />
      </NTabPane>
    </NTabs>
  </Page>
</template>
