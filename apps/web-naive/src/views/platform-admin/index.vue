<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NList,
  NListItem,
  NSpace,
  NSpin,
  NStatistic,
} from 'naive-ui';

import {
  type DailyUsage,
  getDailyUsageApi,
  getUsageOverviewApi,
  type UsageOverview,
} from '#/api/dashboard/usage';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';

const router = useRouter();
const loading = ref(false);
const error = ref(false);
const overview = ref<UsageOverview>();
const dailyUsage = ref<DailyUsage[]>([]);

const totalCost = computed(() =>
  Number(overview.value?.total_cost ?? 0).toFixed(4),
);
const averageLatency = computed(() => {
  const value = overview.value?.avg_latency_ms;
  return value == null ? '—' : `${Math.round(value)} ms`;
});

async function loadUsage() {
  loading.value = true;
  error.value = false;
  try {
    const [summary, daily] = await Promise.all([
      getUsageOverviewApi(),
      getDailyUsageApi(14),
    ]);
    overview.value = summary;
    dailyUsage.value = daily ?? [];
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(loadUsage);
</script>

<template>
  <PlatformWorkspaceShell
    eyebrow="Governance / Quota & Audit"
    title="配额与审计"
    description="查看当前租户的模型调用、Token、成本和延迟；完整运行审计请进入运行观测。"
    :metrics="[
      { label: '调用次数', value: String(overview?.total_calls ?? 0) },
      { label: 'Token 用量', value: String(overview?.total_tokens ?? 0) },
      { label: '累计成本', value: totalCost },
      { label: '平均延迟', value: averageLatency },
    ]"
  >
    <NAlert v-if="error" type="warning" :bordered="false">
      配额与用量暂时不可用，请检查当前租户权限或稍后重试。
    </NAlert>
    <div v-else-if="loading" class="loading"><NSpin size="small" /></div>
    <template v-else>
      <NCard title="当前租户用量" :bordered="false">
        <NSpace :size="32" wrap>
          <NStatistic label="模型数" :value="overview?.model_count ?? 0" />
          <NStatistic
            label="Provider 数"
            :value="overview?.platform_count ?? 0"
          />
          <NStatistic label="累计成本" :value="totalCost" />
          <NStatistic label="平均延迟" :value="averageLatency" />
        </NSpace>
      </NCard>

      <NCard title="近 14 日用量" :bordered="false" class="mt-4">
        <NEmpty v-if="!dailyUsage.length" description="暂无用量记录" />
        <NList v-else bordered>
          <NListItem v-for="item in dailyUsage" :key="item.date">
            <span class="usage-row">
              <strong>{{ item.date }}</strong>
              <small>
                {{ item.call_count }} 次调用 · {{ item.total_tokens }} Token ·
                成本 {{ Number(item.total_cost ?? 0).toFixed(4) }} · 延迟
                {{ Math.round(item.avg_latency_ms ?? 0) }} ms
              </small>
            </span>
          </NListItem>
        </NList>
      </NCard>
    </template>

    <template #side>
      <h3>审计入口</h3>
      <p>Run、Trace、工具审批和取消/失败记录统一在运行观测中查看。</p>
      <NSpace vertical>
        <NButton type="primary" @click="router.push('/observability/runs')">
          查看运行审计
        </NButton>
        <NButton @click="router.push('/observability/approvals')">
          查看工具审批
        </NButton>
        <NButton secondary @click="loadUsage">刷新用量</NButton>
      </NSpace>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.loading {
  display: grid;
  min-height: 180px;
  place-items: center;
}

.usage-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.usage-row small {
  color: #64748b;
}
</style>
