<script lang="ts" setup>
import type { EducationPlanApi } from '#/api/education-admin/plan';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  NButton,
  NCard,
  NGi,
  NGrid,
  NPopconfirm,
  NProgress,
  NSpin,
  NTag,
  NTimeline,
  NTimelineItem,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  deletePlan,
  getPlansByStudent,
  getTodayTasks,
} from '#/api/education-admin/plan';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

import { getStatusType } from './data';
import Form from './modules/form.vue';

const router = useRouter();
const loading = ref(false);
const plans = ref<EducationPlanApi.StudyPlan[]>([]);
const todayTasks = ref<EducationPlanApi.DailyTask[]>([]);
const tasksLoading = ref(false);
const { getCurrentStudentId } = useCurrentStudentId();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

async function loadPlans() {
  loading.value = true;
  try {
    plans.value = await getPlansByStudent(getCurrentStudentId());
  } catch (error) {
    console.error('Failed to load plans:', error);
  } finally {
    loading.value = false;
  }
}

async function loadTodayTasks() {
  tasksLoading.value = true;
  try {
    todayTasks.value = await getTodayTasks(getCurrentStudentId());
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    tasksLoading.value = false;
  }
}

function goToPlan(plan: EducationPlanApi.StudyPlan) {
  router.push({ path: `/learning/plan/${plan.id}` });
}

function onEdit(plan: EducationPlanApi.StudyPlan) {
  formModalApi.setData(plan).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

async function onDelete(plan: EducationPlanApi.StudyPlan) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  try {
    await deletePlan(plan.id);
    message.success($t('ui.actionMessage.deleteSuccess', [plan.name]));
    loadPlans();
  } finally {
    h.destroy();
  }
}

function refresh() {
  loadPlans();
  loadTodayTasks();
}

onMounted(() => {
  loadPlans();
  loadTodayTasks();
});
</script>

<template>
  <Page :title="$t('page.learning.plan')">
    <FormModal @success="refresh" />

    <template #extra>
      <NButton type="primary" @click="onCreate">
        <Plus class="size-5" />
        {{ $t('ui.actionTitle.create', [$t('education.plan.name')]) }}
      </NButton>
    </template>

    <NCard
      class="mb-4"
      :title="$t('education.plan.todayTasks')"
      :bordered="true"
    >
      <NSpin :show="tasksLoading">
        <NTimeline v-if="todayTasks.length">
          <NTimelineItem
            v-for="task in todayTasks"
            :key="task.id"
            :type="task.status === 'COMPLETED' ? 'success' : 'info'"
            :title="task.knowledgeName"
            :content="task.planDate"
          />
        </NTimeline>
        <div v-else class="py-8 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NSpin>
    </NCard>

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

          <template #footer>
            <div class="flex justify-end gap-2">
              <NButton size="small" @click.stop="onEdit(plan)">
                {{ $t('common.edit') }}
              </NButton>
              <NPopconfirm @positive-click.stop="onDelete(plan)">
                <template #trigger>
                  <NButton size="small" type="error">
                    {{ $t('common.delete') }}
                  </NButton>
                </template>
                {{ $t('ui.actionMessage.confirmDelete', [plan.name]) }}
              </NPopconfirm>
            </div>
          </template>
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
