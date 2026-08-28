<script lang="ts" setup>
import type { AgentGraphApi } from '#/features/agent/api';

import { $t } from '#/locales';

defineProps<{
  result: AgentGraphApi.GraphValidationVO;
}>();
</script>

<template>
  <div>
    <div class="mb-4 text-center">
      <span v-if="result.valid" class="text-lg font-bold text-success">
        {{ $t('agent.validationPassed') }}
      </span>
      <span v-else class="text-lg font-bold text-error">
        {{ $t('agent.validationFailed') }}
      </span>
    </div>

    <div v-if="result.errors && result.errors.length > 0" class="mb-3">
      <div class="mb-1 font-bold text-error">
        {{ $t('agent.validationErrors') }}
      </div>
      <div
        v-for="(err, i) in result.errors"
        :key="i"
        class="mb-1 text-sm text-error"
      >
        {{ err }}
      </div>
    </div>

    <div v-if="result.warnings && result.warnings.length > 0">
      <div class="mb-1 font-bold text-warning">
        {{ $t('agent.validationWarnings') }}
      </div>
      <div
        v-for="(warn, i) in result.warnings"
        :key="i"
        class="mb-1 text-sm text-warning"
      >
        {{ warn }}
      </div>
    </div>
  </div>
</template>
