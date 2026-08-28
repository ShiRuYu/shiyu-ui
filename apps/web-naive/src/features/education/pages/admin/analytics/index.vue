<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid } from 'naive-ui';

import { getOverview } from '#/features/education/api';
import MetricCard from '#/shared/ui/metric-card.vue';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const overview = ref<any>({});
const { getCurrentStudentId } = useCurrentStudentId();

onMounted(async () => {
  try {
    overview.value = await getOverview(getCurrentStudentId());
  } catch {
    // noop
  }
});
</script>
<template>
  <Page auto-content-height>
    <NCard :title="$t('page.eduAdmin.analytics')" :bordered="false">
      <NGrid cols="1 s:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
        <NGi>
          <MetricCard
            :value="overview.totalStudyDays || 0"
            :label="$t('analytics.totalStudyDays')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="overview.totalKnowledge || 0"
            :label="$t('analytics.totalKnowledge')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="overview.masteredKnowledge || 0"
            :label="$t('analytics.masteredKnowledge')"
          />
        </NGi>
        <NGi>
          <MetricCard
            :value="`${(overview.accuracy || 0).toFixed(1)}%`"
            :label="$t('analytics.accuracy')"
          />
        </NGi>
      </NGrid>
    </NCard>
  </Page>
</template>
