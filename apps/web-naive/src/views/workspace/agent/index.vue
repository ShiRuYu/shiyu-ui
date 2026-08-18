<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NList,
  NListItem,
  NSelect,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import { chatStream } from '#/api/agent/chat';
import {
  type AiAppSummary,
  type AiAppVersionSummary,
  listRuntimeApps,
  listRuntimeAppVersions,
} from '#/api/runtime';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';

const notice = useMessage();
const route = useRoute();
const apps = ref<AiAppSummary[]>([]);
const versions = ref<AiAppVersionSummary[]>([]);
const selectedAppId = ref<string>();
const selectedVersionId = ref<string>();
const prompt = ref('');
const output = ref('');
const running = ref(false);
const loadError = ref(false);

async function loadApps() {
  try {
    apps.value =
      (await listRuntimeApps())?.filter((app) => app.status !== 'ARCHIVED') ??
      [];
    const requestedAppId =
      typeof route.query.appId === 'string' ? route.query.appId : undefined;
    selectedAppId.value = apps.value.some((app) => app.id === requestedAppId)
      ? requestedAppId
      : apps.value[0]?.id;
    if (selectedAppId.value) await loadVersions(selectedAppId.value);
  } catch {
    loadError.value = true;
  }
}

async function loadVersions(appId: string) {
  versions.value = (await listRuntimeAppVersions(appId)).filter(
    (version) => version.status === 'PUBLISHED',
  );
  selectedVersionId.value = versions.value[0]?.id;
}

async function execute() {
  if (!selectedAppId.value || !prompt.value.trim() || running.value) return;
  const version = versions.value.find(
    (item) => item.id === selectedVersionId.value,
  );
  if (!version) {
    notice.warning('请选择已发布版本');
    return;
  }
  running.value = true;
  output.value = '';
  try {
    await chatStream(
      {
        prompt: prompt.value.trim(),
        appId: selectedAppId.value,
        appVersionId: selectedVersionId.value,
        sceneType: 'agent',
      },
      (chunk) => {
        output.value += chunk;
      },
    );
  } catch {
    notice.error('Agent 执行失败，请查看运行轨迹');
  } finally {
    running.value = false;
  }
}

onMounted(loadApps);
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="AI Workspace / Agent"
    title="Agent 执行工作区"
    description="选择已发布的 AI App，查看执行状态、工具审批和可恢复的运行轨迹。"
    mode="builder"
    :metrics="[
      { label: '可运行 App', value: String(apps.length), tone: 'success' },
      {
        label: '运行状态',
        value: running ? '执行中' : '就绪',
        tone: running ? 'warning' : 'success',
      },
      { label: '已发布版本', value: String(versions.length) },
      { label: 'Runtime', value: 'H2' },
    ]"
  >
    <NSpace vertical size="large" class="agent-form">
      <NAlert v-if="loadError" type="warning" :bordered="false">
        App 列表加载失败，请检查权限或 Runtime 服务。
      </NAlert>
      <NSelect
        v-model:value="selectedAppId"
        :options="apps.map((app) => ({ label: app.name, value: app.id }))"
        placeholder="选择已发布 App"
        @update:value="(value) => value && loadVersions(value)"
      />
      <NSelect
        v-model:value="selectedVersionId"
        :options="
          versions.map((version) => ({
            label: `${version.version} · ${version.status}`,
            value: version.id,
          }))
        "
        placeholder="选择 Published Version"
      />
      <NInput
        v-model:value="prompt"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 10 }"
        placeholder="输入 Agent 任务"
      />
      <NButton
        type="primary"
        :loading="running"
        :disabled="!selectedAppId || !selectedVersionId || !prompt.trim()"
        @click="execute"
      >
        开始执行
      </NButton>
      <NCard v-if="output" size="small" title="执行输出">
        <pre class="output">{{ output }}</pre>
      </NCard>
      <NEmpty v-else description="选择 App 和版本后输入任务开始执行" />
    </NSpace>
    <template #side>
      <h3>运行约束</h3>
      <NList bordered>
        <NListItem>
          <NTag type="success" size="small">Published</NTag>
          仅允许已发布版本
</NListItem
        ><NListItem>工具调用需要按风险审批</NListItem
        ><NListItem>所有步骤写入 Runtime Trace</NListItem>
      </NList>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.agent-form {
  width: 100%;
  max-width: 720px;
}
.output {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
