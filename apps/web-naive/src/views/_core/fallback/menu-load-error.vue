<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { NButton, NCard, NResult, NSpace } from 'naive-ui';

import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const redirectPath = computed(() => {
  const value = route.query.redirect;
  return typeof value === 'string' && value.startsWith('/')
    ? value
    : '/dashboard/overview';
});

async function retry() {
  accessStore.setIsAccessChecked(false);
  await router.replace(redirectPath.value);
}

async function goToLogin() {
  accessStore.setAccessToken(null);
  accessStore.setIsAccessChecked(false);
  await router.replace({
    path: '/auth/login',
    query: { redirect: encodeURIComponent(redirectPath.value) },
  });
}
</script>

<template>
  <Page auto-content-height>
    <NCard class="mx-auto max-w-2xl">
      <NResult
        status="warning"
        :title="$t('common.menuLoadFailedTitle')"
        :description="$t('common.menuLoadFailedDescription')"
      >
        <template #footer>
          <NSpace justify="center">
            <NButton type="primary" @click="retry">
              {{ $t('common.retry') }}
            </NButton>
            <NButton @click="goToLogin">
              {{ $t('common.backToLogin') }}
            </NButton>
          </NSpace>
        </template>
      </NResult>
    </NCard>
  </Page>
</template>
