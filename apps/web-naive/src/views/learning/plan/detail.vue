<script lang="ts" setup>
import type { EducationPlanApi } from '#/api/education-admin/plan';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NProgress,
  NTag,
  NTimeline,
  NTimelineItem,
} from 'naive-ui';

import { getPlanById } from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const plan = ref<EducationPlanApi.StudyPlan>();
const loading = ref(false);

async function loadPlan() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    plan.value = await getPlanById(id);
  } catch (error) {
    console.error('Failed to load plan:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPlan();
});
</script>

<template>
  <Page :title="plan?.name || $t('page.learning.planDetail')">
    <template #extra>
      <NButton @click="router.back()">
        {{ $t('common.back') }}
      </NButton>
    </template>

    <div class="grid grid-cols-3 gap-4">
      <NCard class="col-span-1" :title="$t('education.plan.title')">
        <NDescriptions v-if="plan" label-placement="left" bordered>
          <NDescriptionsItem :label="$t('education.plan.name')">
            {{ plan.name }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.plan.startDate')">
            {{ plan.startDate }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('education.plan.endDate')">
            {{ plan.endDate }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="$t('common.status')">
            <NTag
              :type="plan.status === 0 /* ACTIVE */ ? 'success' : 'default'"
            >
              {{ plan.status }}
            </NTag>
          </NDescriptionsItem>
        </NDescriptions>

        <div v-if="plan" class="mt-4">
          <div class="mb-1 flex justify-between text-sm">
            <span>{{ $t('education.plan.completedItems') }}</span>
            <span
              >{{ plan.completedItems || 0 }} / {{ plan.totalItems || 0 }}</span
            >
          </div>
          <NProgress
            type="line"
            :percentage="
              plan.totalItems
                ? Math.round(
                    ((plan.completedItems || 0) / plan.totalItems) * 100,
                  )
                : 0
            "
          />
        </div>
      </NCard>

      <NCard class="col-span-2" :title="$t('education.plan.todayTasks')">
        <NTimeline v-if="plan?.items?.length">
          <NTimelineItem
            v-for="item in plan.items"
            :key="item.id"
            :type="
              item.status === 2 /* COMPLETED */
                ? 'success'
                : item.status === 1 /* IN_PROGRESS */
                  ? 'info'
                  : 'default'
            "
            :title="item.knowledgeName || `知识点 #${item.knowledgeId}`"
            :content="`${item.planDate} - ${item.statusDesc || item.status}`"
          />
        </NTimeline>
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NCard>
    </div>
  </Page>
</template>
