<script lang="ts" setup>
import { NCard } from 'naive-ui';

withDefaults(
  defineProps<{
    description?: string;
    label: string;
    value: number | string;
  }>(),
  { description: undefined },
);
</script>

<template>
  <NCard size="small" class="metric-card">
    <div class="text-sm text-muted-foreground">{{ label }}</div>
    <div class="mt-1 text-2xl font-semibold tabular-nums">{{ value }}</div>
    <div v-if="description" class="mt-1 text-xs text-muted-foreground">
      {{ description }}
    </div>
  </NCard>
</template>

<style scoped>
.metric-card {
  min-width: 0;
  height: 100%;
}
</style>
