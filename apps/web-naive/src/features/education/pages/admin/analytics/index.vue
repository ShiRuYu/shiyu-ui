<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid, NSelect } from 'naive-ui';

import {
  type EducationAnalyticsApi,
  getOverview,
  getStudentOptions,
} from '#/features/education/api';
import { $t } from '#/locales';
import MetricCard from '#/shared/ui/metric-card.vue';

const overview = ref<EducationAnalyticsApi.OverviewResponse | null>(null);
const selectedStudentId = ref<null | number>(null);
const studentOptions = ref<Array<{ label: string; value: number }>>([]);

onMounted(async () => {
  studentOptions.value = (await getStudentOptions()).map((student) => ({
    label: student.name,
    value: student.id,
  }));
});

async function loadOverview() {
  overview.value = selectedStudentId.value
    ? await getOverview(selectedStudentId.value)
    : null;
}
</script>
<template>
  <Page auto-content-height>
    <NCard :title="$t('page.eduAdmin.analytics')" :bordered="false">
      <NSelect
        v-model:value="selectedStudentId"
        :options="studentOptions"
        :placeholder="$t('education.wrongQuestion.selectStudent')"
        clearable
        class="mb-4 w-[220px]"
        @update:value="loadOverview"
      />
      <NGrid cols="1 s:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
        <NGi>
          <MetricCard
            :value="overview?.totalStudyDays || 0"
            :label="$t('analytics.totalStudyDays')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="overview?.totalKnowledge || 0"
            :label="$t('analytics.totalKnowledge')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="overview?.masteredKnowledge || 0"
            :label="$t('analytics.masteredKnowledge')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="`${(overview?.accuracy || 0).toFixed(1)}%`"
            :label="$t('analytics.accuracy')"
          />
        </NGi>
      </NGrid>
    </NCard>
  </Page>
</template>
