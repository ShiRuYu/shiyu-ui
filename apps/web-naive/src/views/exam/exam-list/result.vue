<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NResult } from 'naive-ui';

import { $t } from '#/locales';

const router = useRouter();
</script>

<template>
  <Page :title="$t('page.exam.result')">
    <NCard>
      <NResult status="success" title="交卷成功" description="考试已完成提交">
        <template #footer>
          <NButton type="primary" @click="router.push('/exam/list')">
返回考试列表
</NButton>
        </template>
      </NResult>
    </NCard>
  </Page>
</template>
