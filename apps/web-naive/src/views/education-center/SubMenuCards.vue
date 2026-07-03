<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';

import { useRouter } from 'vue-router';

import { NButton, NCard, NGi, NGrid, NIcon } from 'naive-ui';

interface CardItem {
  icon: string;
  title: string;
  description: string;
  route: RouteLocationRaw;
}

const props = defineProps<{
  cards: CardItem[];
  cols?: number;
}>();

const router = useRouter();

function navigate(route: RouteLocationRaw) {
  if (typeof route === 'string') {
    router.push(route);
  } else {
    router.push(route);
  }
}
</script>

<template>
  <div class="p-5">
    <NGrid :cols="props.cols ?? 3" :x-gap="16" :y-gap="16" responsive="screen">
      <NGi v-for="(card, index) in props.cards" :key="index">
        <NCard
          :title="card.title"
          :bordered="true"
          hoverable
          class="submenu-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
          @click="navigate(card.route)"
        >
          <template #header-extra>
            <NIcon size="28" class="text-primary">
              <span :class="card.icon" />
            </NIcon>
          </template>
          <p class="text-muted-foreground text-sm">
            {{ card.description }}
          </p>
          <template #footer>
            <NButton size="small" type="primary" ghost>
              进入
            </NButton>
          </template>
        </NCard>
      </NGi>
    </NGrid>
  </div>
</template>

<style scoped>
.submenu-card {
  height: 100%;
}
.submenu-card :deep(.n-card-header) {
  align-items: flex-start;
}
</style>
