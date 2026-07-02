<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NGi, NGrid, NProgress, NSpace, NTag } from 'naive-ui';

import { completeReview, getTodayReviews } from '#/api/education/review';
import { $t } from '#/locales';

const loading = ref(false);
const reviews = ref<any[]>([]);

async function loadReviews() {
  loading.value = true;
  try {
    reviews.value = await getTodayReviews(1);
  } catch (error) {
    console.error('Failed to load reviews:', error);
  } finally {
    loading.value = false;
  }
}

async function handleComplete(review: any) {
  try {
    await completeReview(review.id, { studentId: 1, resultScore: 80 });
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
                review.knowledgeName || `知识点 #${review.knowledgeId}`
              }}</span>
              <NTag type="warning" size="small">
第{{ review.reviewRound }}轮
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
              完成复习
            </NButton>
          </template>
        </NCard>
      </NGi>
    </NGrid>

    <div
      v-if="!loading && reviews.length === 0"
      class="py-20 text-center text-gray-400"
    >
      今日没有复习任务
    </div>
  </Page>
</template>
