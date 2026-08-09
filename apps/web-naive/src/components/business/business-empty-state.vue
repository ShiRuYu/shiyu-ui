<script lang="ts" setup>
import { NEmpty } from 'naive-ui';

defineProps<{
  description: string;
}>();
</script>

<template>
  <NEmpty :description class="py-10">
    <template v-if="$slots.default" #extra>
      <slot></slot>
    </template>
  </NEmpty>
</template>
