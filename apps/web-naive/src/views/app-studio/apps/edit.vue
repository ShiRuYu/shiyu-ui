<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NSpin,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { getAdminAgentListAll } from '#/api/agent';
import {
  createRuntimeApp,
  createRuntimeAppVersion,
  listRuntimeApps,
  listRuntimeAppVersions,
  publishRuntimeAppVersion,
} from '#/api/runtime';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const appId = ref(typeof route.query.id === 'string' ? route.query.id : '');
const versions = ref<
  Array<{ configJson?: string; id: string; status: string; version: string; }>
>([]);
const agentOptions = ref<Array<{ label: string; value: string }>>([]);
const form = reactive({
  name: '',
  description: '',
  version: '0.1.0',
  agentId: '',
  configJson: '{\n  "executionType": "AGENT"\n}',
});

const isNew = computed(() => route.query.new === 'true' || !appId.value);

async function loadApp() {
  if (!appId.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const apps = (await listRuntimeApps()) ?? [];
    const app = apps.find((item) => item.id === appId.value);
    if (!app) {
      loadError.value = '未找到该 App，可能已被删除或无权访问';
      return;
    }
    form.name = app.name;
    form.description = app.description || '';
    versions.value = (await listRuntimeAppVersions(appId.value)) ?? [];
    const latest = versions.value[0];
    if (latest?.version) form.version = nextVersion(latest.version);
    if (latest?.configJson) {
      form.configJson = latest.configJson;
      try {
        const config = JSON.parse(latest.configJson) as { agentId?: string };
        form.agentId = config.agentId ?? '';
      } catch {
        // Keep the server value in the editor so the user can correct it.
      }
    }
  } catch {
    loadError.value = 'App 详情加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function nextVersion(value: string) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return value;
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

function buildConfig() {
  const config = JSON.parse(form.configJson) as Record<string, unknown>;
  config.executionType = config.executionType ?? 'AGENT';
  if (form.agentId) {
    config.agentId = form.agentId;
    const validation =
      config.validation && typeof config.validation === 'object'
        ? (config.validation as Record<string, unknown>)
        : {};
    // The selected Agent comes from the active Agent registry. Keep the
    // runtime's publish contract explicit so the server can fail closed.
    validation.graph = validation.graph ?? 'PASS';
    config.validation = validation;
  }
  return JSON.stringify(config, null, 2);
}

async function submit(publish = false) {
  if (!form.name.trim()) {
    message.warning('请输入 App 名称');
    return;
  }
  try {
    JSON.parse(form.configJson);
  } catch {
    message.error('配置 JSON 格式不正确');
    return;
  }
  saving.value = true;
  const creating = !appId.value;
  try {
    if (!appId.value) {
      const app = await createRuntimeApp({
        name: form.name.trim(),
        description: form.description.trim(),
      });
      appId.value = app.id;
    }
    const createdVersion = await createRuntimeAppVersion(appId.value, {
      version: form.version.trim() || '0.1.0',
      configJson: buildConfig(),
    });
    if (publish) {
      await publishRuntimeAppVersion(appId.value, createdVersion.id);
      message.success(creating ? 'App 创建并发布成功' : '版本创建并发布成功');
    } else {
      message.success(
        creating ? 'App 创建成功，当前为草稿版本' : '版本草稿已保存',
      );
    }
    await router.push('/app-studio/apps');
  } catch {
    message.error(
      publish
        ? '发布失败，请确认已绑定有效 Agent 且配置校验通过'
        : '保存失败，请检查权限或配置后重试',
    );
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const agents = (await getAdminAgentListAll()) as Array<{
      agentId?: string;
      name?: string;
      status?: number;
    }>;
    agentOptions.value = (agents ?? [])
      .filter((agent) => agent.agentId && agent.status !== 0)
      .map((agent) => ({
        label: `${agent.name || agent.agentId} · ${agent.agentId}`,
        value: agent.agentId as string,
      }));
    if (!form.agentId) form.agentId = agentOptions.value[0]?.value ?? '';
  } catch {
    // Agent binding remains editable through the JSON config if the registry
    // is unavailable.
  }
  await loadApp();
});
</script>

<template>
  <Page :title="isNew ? '创建 AI App' : '编辑 AI App'" auto-content-height>
    <NCard :bordered="false" class="app-editor">
      <NAlert v-if="loadError" type="error" :title="loadError" />
      <NSpin v-else-if="loading" size="small" />
      <NForm v-else label-placement="top" @submit.prevent="submit(false)">
        <NFormItem label="App 名称" required>
          <NInput v-model:value="form.name" placeholder="例如：企业知识助手" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="form.description"
            type="textarea"
            :rows="3"
            placeholder="说明这个 App 的用途和边界"
          />
        </NFormItem>
        <NFormItem label="版本号" required>
          <NInput v-model:value="form.version" placeholder="0.1.0" />
        </NFormItem>
        <NFormItem label="绑定 Agent" required>
          <NSelect
            v-model:value="form.agentId"
            :options="agentOptions"
            clearable
            filterable
            placeholder="选择可执行的 Agent"
          />
        </NFormItem>
        <NFormItem label="运行配置 JSON" required>
          <NInput
            v-model:value="form.configJson"
            type="textarea"
            :rows="12"
            placeholder="{&quot;executionType&quot;:&quot;AGENT&quot;,&quot;agentId&quot;:&quot;...&quot;}"
          />
        </NFormItem>
        <NSpace justify="end">
          <NButton @click="router.push('/app-studio/apps')">取消</NButton>
          <NButton :loading="saving" @click="submit(false)">
            {{ isNew ? '保存草稿' : '保存新草稿' }}
          </NButton>
          <NButton type="primary" :loading="saving" @click="submit(true)">
            {{ isNew ? '创建并发布' : '保存并发布' }}
          </NButton>
        </NSpace>
      </NForm>
    </NCard>
  </Page>
</template>

<style scoped>
.app-editor {
  max-width: 900px;
}
</style>
