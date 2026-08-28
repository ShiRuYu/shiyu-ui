<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSpace, NTag } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    actions?: Array<{ label: string; path?: string }>;
    description: string;
    eyebrow: string;
    metrics?: Array<{
      label: string;
      tone?: 'error' | 'success' | 'warning';
      value: string;
    }>;
    mode?: 'builder' | 'focus' | 'standard';
    title: string;
  }>(),
  { mode: 'standard', metrics: () => [], actions: () => [] },
);

const router = useRouter();

function runAction(action: { label: string; path?: string }) {
  if (action.path) router.push(action.path);
}

const gridClass = computed(() =>
  props.mode === 'builder' ? 'builder-grid' : 'standard-grid',
);
</script>

<template>
  <Page auto-content-height class="platform-shell" :class="[`mode-${mode}`]">
    <div class="shell-header">
      <div>
        <div class="eyebrow">{{ eyebrow }}</div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <NSpace v-if="actions.length" :wrap="false">
        <NButton
          v-for="action in actions"
          :key="action.label"
          type="primary"
          :disabled="!action.path"
          @click="runAction(action)"
        >
          {{ action.label }}
        </NButton>
      </NSpace>
    </div>
    <div v-if="metrics.length" class="metric-grid">
      <NCard
        v-for="metric in metrics"
        :key="metric.label"
        size="small"
        :bordered="false"
        class="metric-card"
      >
        <div class="metric-label">{{ metric.label }}</div>
        <div class="metric-value">{{ metric.value }}</div>
        <NTag v-if="metric.tone" size="small" :type="metric.tone">
          {{
            metric.tone === 'success'
              ? '正常'
              : metric.tone === 'warning'
                ? '关注'
                : '异常'
          }}
        </NTag>
      </NCard>
    </div>
    <div :class="gridClass">
      <NCard class="main-card" :bordered="false"><slot></slot></NCard>
      <NCard class="side-card" :bordered="false">
        <slot name="side"></slot>
      </NCard>
    </div>
  </Page>
</template>

<style scoped>
.platform-shell {
  --shell-border: rgb(148 163 184 / 18%);
}

.shell-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin: 4px 0 6px;
  font-size: 26px;
  font-weight: 700;
}

.shell-header p {
  max-width: 720px;
  margin: 0;
  color: #64748b;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  background: linear-gradient(
    135deg,
    rgb(37 99 235 / 8%),
    rgb(14 165 233 / 3%)
  );
}

.metric-label {
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  margin: 6px 0 3px;
  font-size: 24px;
  font-weight: 700;
}

.standard-grid,
.builder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  min-height: 0;
}

.builder-grid {
  grid-template-columns: minmax(0, 1fr) 360px;
}

.main-card,
.side-card {
  min-height: 300px;
}

.mode-focus .side-card {
  display: none;
}

.mode-focus .standard-grid {
  display: block;
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .standard-grid,
  .builder-grid {
    grid-template-columns: 1fr;
  }

  .side-card {
    min-height: 180px;
  }
}

@media (max-width: 600px) {
  .shell-header {
    flex-direction: column;
    gap: 12px;
  }

  .metric-grid {
    grid-template-columns: 1fr 1fr;
  }

  h1 {
    font-size: 22px;
  }
}
</style>
