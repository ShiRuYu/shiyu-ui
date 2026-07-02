<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { $t } from '#/locales';
</script>
<template>
  <Page auto-content-height>
    <div
      class="flex size-full items-center justify-center text-muted-foreground"
    >
      {{ $t('knowledge.graph') }}
    </div>
  </Page>
</template>
