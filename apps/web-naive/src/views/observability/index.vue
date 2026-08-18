<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import {
  NAlert,
  NButton,
  NEmpty,
  NList,
  NListItem,
  NSpin,
  NTag,
} from 'naive-ui';

import {
  type AiRunEvent,
  type AiRunSummary,
  getRuntimeRunEvents,
  listRuntimeRuns,
} from '#/api/runtime';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';

const runs = ref<AiRunSummary[]>([]);
const selectedRun = ref<AiRunSummary>();
const selectedEvents = ref<AiRunEvent[]>([]);
const eventLoading = ref(false);
const loading = ref(false);
const error = ref(false);
const successRate = computed(() => {
  if (!runs.value.length) return '—';
  const completed = runs.value.filter(
    (run) => run.status === 'COMPLETED',
  ).length;
  return `${Math.round((completed / runs.value.length) * 1000) / 10}%`;
});
onMounted(async () => {
  loading.value = true;
  try {
    runs.value = (await listRuntimeRuns(50)) ?? [];
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});

async function inspectRun(run: AiRunSummary) {
  selectedRun.value = run;
  eventLoading.value = true;
  try {
    selectedEvents.value = (await getRuntimeRunEvents(run.id)) ?? [];
  } catch {
    selectedEvents.value = [];
  } finally {
    eventLoading.value = false;
  }
}
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Runtime Observability"
    title="运行观测"
    description="按 Run、Trace、模型、工具和租户查看执行链路、Token、成本与错误。"
    :metrics="[
      { label: '最近 Run', value: String(runs.length) },
      {
        label: '成功率',
        value: successRate,
        tone: runs.length && successRate !== '100%' ? 'warning' : 'success',
      },
      {
        label: '输入 Token',
        value: String(
          runs.reduce((sum, run) => sum + (run.promptTokens ?? 0), 0),
        ),
      },
      {
        label: '失败 Run',
        value: String(runs.filter((run) => run.status === 'FAILED').length),
        tone: runs.some((run) => run.status === 'FAILED') ? 'error' : 'success',
      },
    ]"
  >
    <NAlert v-if="error" type="warning" :bordered="false">
      运行记录暂时不可用，请稍后重试。
    </NAlert>
    <div v-if="loading" class="loading"><NSpin size="small" /></div>
    <NEmpty v-else-if="!runs.length" description="暂无运行记录" />
    <NList v-else bordered>
      <NListItem
        v-for="run in runs"
        :key="run.id"
        class="run-item"
        @click="inspectRun(run)"
      >
        <div class="run-row">
          <span
            ><strong>{{ run.id }}</strong
            ><small
              >{{ run.sourceType || 'API' }} ·
              {{ run.model || '未指定模型' }}</small
            ></span
          >
        </div>
        <template #suffix>
          <NButton text type="primary" @click.stop="inspectRun(run)">
            查看 Trace
</NButton
          ><NTag
            size="small"
            :type="
              run.status === 'FAILED'
                ? 'error'
                : run.status === 'COMPLETED'
                  ? 'success'
                  : 'warning'
            "
          >
            {{ run.status }}
          </NTag>
        </template>
      </NListItem>
    </NList>
    <template #side>
      <h3>{{ selectedRun ? 'Run Trace' : '事件事实源' }}</h3>
      <template v-if="selectedRun">
        <p class="run-detail">
          <strong>{{ selectedRun.id }}</strong
          ><br />{{ selectedRun.status }} ·
          {{ selectedRun.model || '未指定模型' }}
        </p>
        <NSpin v-if="eventLoading" size="small" /><NList
          v-else-if="selectedEvents.length"
          size="small"
          bordered
        >
          <NListItem
            v-for="event in selectedEvents.slice(-8)"
            :key="`${event.runId}-${event.seq}`"
          >
            <span class="event-row"
              ><NTag size="tiny">#{{ event.seq }}</NTag
              >{{ event.type }}</span
            >
          </NListItem>
</NList
        ><NEmpty v-else description="暂无事件" /><NButton
          text
          type="primary"
          @click="
            selectedRun = undefined;
            selectedEvents = [];
          "
        >
          返回说明
        </NButton>
      </template>
      <p v-else>
        所有 Conversation、Agent、Retrieval、Memory、Tool 和 Model 事件统一从
        AI_RUN_EVENT 按 seq 回放。点击 Run 可查看最近事件。
      </p>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.loading {
  display: grid;
  place-items: center;
  min-height: 180px;
}
.run-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}
.run-row span {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.run-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
}
.run-row small {
  color: #64748b;
}
.run-item {
  cursor: pointer;
}
.event-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.run-detail {
  line-height: 1.7;
}
</style>
