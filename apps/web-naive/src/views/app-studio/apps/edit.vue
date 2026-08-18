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
  NSpace,
  NSpin,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  createRuntimeApp,
  createRuntimeAppVersion,
  listRuntimeApps,
  listRuntimeAppVersions,
} from '#/api/runtime';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const appId = ref(typeof route.query.id === 'string' ? route.query.id : '');
const versions = ref<Array<{ id: string; status: string; version: string }>>(
  [],
);
const form = reactive({
  name: '',
  description: '',
  version: '0.1.0',
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
    if (versions.value[0]?.version) form.version = versions.value[0].version;
  } catch {
    loadError.value = 'App 详情加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

async function submit() {
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
    await createRuntimeAppVersion(appId.value, {
      version: form.version.trim() || '0.1.0',
      configJson: form.configJson,
    });
    message.success(creating ? 'App 创建成功' : '版本创建成功');
    await router.push('/app-studio/apps');
  } catch {
    message.error('保存失败，请检查权限或配置后重试');
  } finally {
    saving.value = false;
  }
}

onMounted(loadApp);
</script>

<template>
  <Page :title="isNew ? '创建 AI App' : '编辑 AI App'" auto-content-height>
    <NCard :bordered="false" class="app-editor">
      <NAlert v-if="loadError" type="error" :title="loadError" />
      <NSpin v-else-if="loading" size="small" />
      <NForm v-else label-placement="top" @submit.prevent="submit">
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
          <NButton type="primary" :loading="saving" @click="submit">
            {{ isNew ? '创建 App' : '保存版本' }}
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
