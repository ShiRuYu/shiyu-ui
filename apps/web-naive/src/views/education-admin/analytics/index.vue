<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid, NStatistic } from 'naive-ui';

import { getOverview } from '#/api/education/analytics';
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
      <NGrid :cols="4" :x-gap="16" :y-gap="16">
        <NGi>
          <NCard :bordered="true">
            <NStatistic
              :value="overview.totalStudyDays || 0"
              :label="$t('analytics.totalStudyDays')"
            />
          </NCard>
        </NGi>
        <NGi>
          <NCard :bordered="true">
            <NStatistic
              :value="overview.totalKnowledge || 0"
              :label="$t('analytics.totalKnowledge')"
            />
          </NCard>
        </NGi>
        <NGi>
          <NCard :bordered="true">
            <NStatistic
              :value="overview.masteredKnowledge || 0"
              :label="$t('analytics.masteredKnowledge')"
            />
          </NCard>
        </NGi>
        <NGi>
          <NCard :bordered="true">
            <NStatistic
              :value="(overview.accuracy || 0).toFixed(1)"
              :label="$t('analytics.accuracy')"
            />
          </NCard>
        </NGi>
      </NGrid>
    </NCard>
  </Page>
</template>
