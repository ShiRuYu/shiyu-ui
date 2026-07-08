<script lang="ts" setup>
import type { EducationReviewApi } from '#/api/education/review';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NGi, NGrid, NProgress, NSpace, NTag } from 'naive-ui';

import { completeReview, getTodayReviews } from '#/api/education/review';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const loading = ref(false);
const reviews = ref<EducationReviewApi.ReviewTask[]>([]);
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
    review.status = 'COMPLETED';
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => loadReviews());
</script>

<template>
  <Page :title="$t('page.review.today')">
    <NGrid :cols="2" :x-gap="16" :y-gap="16">
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
            <span>{{ $t('education.review.reviewDate') }}:
              {{ review.reviewDate }}</span>
            <span>
              {{ $t('common.status') }}:
              <NTag
                :type="review.status === 'PENDING' ? 'warning' : 'success'"
                size="small"
              >
                {{
                  $t(
                    `education.review.status${review.status === 'PENDING' ? 'Pending' : 'Completed'}`,
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
              v-if="review.status === 'PENDING'"
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
  </Page>
</template>
