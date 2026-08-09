<script setup lang="ts">
import type { WorkbenchProjectItem } from '../typing';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VbenIcon,
} from '@vben-core/shadcn-ui';

interface Props {
  items?: WorkbenchProjectItem[];
  title: string;
}

defineOptions({
  name: 'WorkbenchProject',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});

defineEmits(['click']);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="project-grid p-0">
      <template v-for="(item, index) in items" :key="item.title">
        <div
          class="project-item border-border group min-w-0 cursor-pointer border-b border-r border-t p-4 transition-all hover:shadow-xl"
          @click="$emit('click', item)"
        >
          <div class="flex min-w-0 items-center">
            <VbenIcon
              :color="item.color"
              :icon="item.icon"
              class="size-8 shrink-0 transition-all duration-300 group-hover:scale-110"
            />
            <span class="ml-4 min-w-0 break-words text-lg font-medium">
              {{ item.title }}
            </span>
          </div>

          <!-- 内容区域支持插槽自定义 -->
          <slot name="content" :item="item" :index="index">
            <div class="text-foreground/80 mt-4 min-h-10 break-words">
              {{ item.content }}
            </div>
          </slot>

          <!-- 底部信息区域支持插槽自定义 -->
          <slot name="footer" :item="item" :index="index">
            <div
              class="text-foreground/80 flex min-w-0 flex-wrap justify-between gap-2"
            >
              <span class="min-w-0 break-words">{{ item.group }}</span>
              <span v-if="item.date" class="min-w-0 break-all text-right">
                {{ item.date }}
              </span>
            </div>
          </slot>
        </div>
      </template>
    </CardContent>
  </Card>
</template>

<style scoped>
.project-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.project-item {
  overflow: hidden;
}

@media (min-width: 768px) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1536px) {
  .project-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
