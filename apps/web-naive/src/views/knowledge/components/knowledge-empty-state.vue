<script setup lang="ts">
import { NButton, NEmpty } from 'naive-ui';

defineProps<{
  actionText?: string;
  description: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <NEmpty :description="description" class="py-14">
    <template v-if="actionText" #extra>
      <NButton type="primary" @click="emit('action')">{{ actionText }}</NButton>
    </template>
  </NEmpty>
</template>
