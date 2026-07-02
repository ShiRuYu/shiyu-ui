<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { NButton, NCard, NSpace } from 'naive-ui';

import { message } from '#/adapter/naive';
import { clearIndex, rebuildIndex } from '#/api/knowledge/index-rebuild';
import { $t } from '#/locales';

async function handleRebuild() {
  message.loading($t('knowledge.rebuildIndex'));
  try {
    await rebuildIndex();
    message.success($t('ui.actionMessage.operationSuccess'));
  } catch (error) {
    console.error(error);
  }
}

async function handleClear() {
  message.loading($t('knowledge.clearIndex'));
  try {
    await clearIndex();
    message.success($t('ui.actionMessage.operationSuccess'));
  } catch (error) {
    console.error(error);
  }
}
</script>
<template>
  <Page auto-content-height>
    <div class="p-6">
      <NCard :title="$t('knowledge.index')">
        <NSpace vertical>
          <p class="text-muted-foreground">
            {{ $t('knowledge.rebuildIndex') }}
          </p>
          <NSpace>
            <NButton type="primary" @click="handleRebuild">
              {{ $t('knowledge.rebuildIndex') }}
            </NButton>
            <NButton type="error" @click="handleClear">
              {{ $t('knowledge.clearIndex') }}
            </NButton>
          </NSpace>
        </NSpace>
      </NCard>
    </div>
  </Page>
</template>
