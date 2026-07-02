<script lang="ts" setup>
import type { EducationPlanApi } from '#/api/education/plan';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid, NProgress, NTag } from 'naive-ui';

import { getPlansByStudent } from '#/api';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const plans = ref<EducationPlanApi.StudyPlan[]>([]);

async function loadPlans() {
  loading.value = true;
  try {
    plans.value = await getPlansByStudent(1);
  } catch (error) {
    console.error('Failed to load plans:', error);
  } finally {
    loading.value = false;
  }
}

function goToPlan(plan: EducationPlanApi.StudyPlan) {
  router.push({ path: `/learning/plan/${plan.id}` });
}

function getStatusType(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'COMPLETED':
      return 'info';
    case 'PAUSED':
      return 'warning';
    default:
      return 'default';
  }
}

onMounted(() => {
  loadPlans();
});
</script>

<template>
  <Page :title="$t('page.learning.plan')">
    <NGrid :cols="3" :x-gap="16" :y-gap="16" responsive="screen">
      <NGi v-for="plan in plans" :key="plan.id">
        <NCard hoverable class="cursor-pointer" @click="goToPlan(plan)">
          <template #header>
            <span class="text-base font-medium">{{ plan.name }}</span>
          </template>
          <template #header-extra>
            <NTag :type="getStatusType(plan.status)" size="small">
              {{ plan.status }}
            </NTag>
          </template>

          <div class="space-y-3">
            <div class="text-sm text-gray-500">
              {{ plan.startDate }} ~ {{ plan.endDate }}
            </div>

            <div>
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ $t('education.plan.completedItems') }}</span>
                <span>{{ plan.completedItems || 0 }} /
                  {{ plan.totalItems || 0 }}</span>
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
                :show-indicator="true"
              />
            </div>
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <div
      v-if="!loading && plans.length === 0"
      class="py-20 text-center text-gray-400"
    >
      {{ $t('common.noData') }}
    </div>
  </Page>
</template>
