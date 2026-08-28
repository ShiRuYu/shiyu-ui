<script setup lang="ts">
import { computed } from 'vue';

import { NTag } from 'naive-ui';

import {
  getStatusLabel,
  getStatusType,
} from '#/features/knowledge/model/status';

const props = defineProps<{
  size?: 'large' | 'medium' | 'small';
  value?: null | string;
}>();

const type = computed(() => getStatusType(props.value));
</script>

<template>
  <NTag :size="size ?? 'small'" :type="type">
    {{ getStatusLabel(value) }}
  </NTag>
</template>
