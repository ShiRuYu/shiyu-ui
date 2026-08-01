<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NEmpty, NSpin } from 'naive-ui';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  router.replace({
    path: '/knowledge/graph',
    query: route.query,
  });
});
</script>

<template>
  <Page title="关系编排">
    <div class="flex min-h-[320px] items-center justify-center">
      <NSpin size="large">
        <NEmpty description="正在进入图谱洞察关系编排" />
      </NSpin>
    </div>
  </Page>
</template>
