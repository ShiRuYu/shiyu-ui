<script setup lang="ts">
import type { AiAppSummary, AiAppVersionSummary } from '#/features/agent';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  NButton,
  NEmpty,
  NList,
  NListItem,
  NProgress,
  NSpin,
  NTag,
} from 'naive-ui';

import { listRuntimeApps, listRuntimeAppVersions } from '#/features/agent';
import { PlatformWorkspaceShell } from '#/shared';

const router = useRouter();
const apps = ref<AiAppSummary[]>([]);
const appVersions = ref<Record<string, AiAppVersionSummary[]>>({});
const loading = ref(false);
const loadError = ref(false);
const draftCount = computed(
  () =>
    apps.value.filter(
      (app) =>
        !(appVersions.value[app.id] ?? []).some(
          (version) => version.status === 'PUBLISHED',
        ),
    ).length,
);
const publishedCount = computed(
  () =>
    apps.value.filter((app) =>
      (appVersions.value[app.id] ?? []).some(
        (version) => version.status === 'PUBLISHED',
      ),
    ).length,
);

onMounted(async () => {
  loading.value = true;
  try {
    apps.value = (await listRuntimeApps()) ?? [];
    const versionEntries = await Promise.all(
      apps.value.map(async (app) => {
        try {
          return [
            app.id,
            (await listRuntimeAppVersions(app.id)) ?? [],
          ] as const;
        } catch {
          return [app.id, []] as const;
        }
      }),
    );
    appVersions.value = Object.fromEntries(versionEntries);
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
});

function openApp(app: AiAppSummary) {
  router.push({ path: '/workspace/agent', query: { appId: app.id } });
}
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Application Development"
    title="AI App Studio"
    description="集中管理 App、Agent、Prompt、Knowledge、Memory、工具权限和发布版本。"
    mode="builder"
    :metrics="[
      { label: 'App 总数', value: String(apps.length) },
      {
        label: '草稿 App',
        value: String(draftCount),
        tone: draftCount ? 'warning' : 'success',
      },
      {
        label: '已发布 App',
        value: String(publishedCount),
        tone: publishedCount ? 'success' : 'warning',
      },
      { label: '发布治理', value: '评测门槛' },
    ]"
    :actions="[{ label: '创建 App', path: '/app-studio/apps/edit?new=true' }]"
  >
    <NSpin v-if="loading" size="small" />
    <NEmpty v-else-if="loadError" description="App 列表加载失败，请稍后重试" />
    <NEmpty
      v-else-if="!apps.length"
      description="暂无 App，先创建一个草稿版本"
    />
    <NList v-else bordered>
      <NListItem v-for="app in apps" :key="app.id">
        <span
          ><strong>{{ app.name }}</strong
          ><small
            >{{ app.description || '未填写描述' }} ·
            {{ app.status || 'ACTIVE' }}</small
          ><small>
            <NTag
              v-if="
                (appVersions[app.id] || []).some(
                  (version) => version.status === 'PUBLISHED',
                )
              "
              type="success"
              size="small"
              >已发布</NTag
            >
            <NTag v-else type="warning" size="small">待发布</NTag>
            · {{ (appVersions[app.id] || []).length }} 个版本
          </small></span
        ><template #suffix>
          <NButton text type="primary" @click="openApp(app)">
            打开工作区
          </NButton>
        </template>
      </NListItem>
    </NList>
    <template #side>
      <h3>发布门槛</h3>
      <NProgress type="line" :percentage="92" processing />
      <p>评测、模型能力、知识权限、工具权限和预算检查全部通过后才可发布。</p>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.n-list-item span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.n-list-item small {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #64748b;
}
</style>
