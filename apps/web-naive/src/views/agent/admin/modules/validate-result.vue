<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';

defineProps<{
  result: AgentGraphApi.GraphValidationVO;
}>();
</script>

<template>
  <div>
    <div class="mb-4 text-center">
      <span v-if="result.valid" class="text-lg font-bold text-green-500">
        校验通过
      </span>
      <span v-else class="text-lg font-bold text-red-500"> 校验失败 </span>
    </div>

    <div v-if="result.errors && result.errors.length > 0" class="mb-3">
      <div class="mb-1 font-bold text-red-500">错误</div>
      <div
        v-for="(err, i) in result.errors"
        :key="i"
        class="mb-1 text-sm text-red-400"
      >
        {{ err }}
      </div>
    </div>

    <div v-if="result.warnings && result.warnings.length > 0">
      <div class="mb-1 font-bold text-yellow-500">警告</div>
      <div
        v-for="(warn, i) in result.warnings"
        :key="i"
        class="mb-1 text-sm text-yellow-400"
      >
        {{ warn }}
      </div>
    </div>
  </div>
</template>
