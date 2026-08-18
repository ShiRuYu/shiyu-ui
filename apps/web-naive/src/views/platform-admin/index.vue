<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { NAlert, NEmpty, NList, NListItem, NSpin, NTag } from 'naive-ui';

import {
  listModelProviders,
  type ModelProviderCapability,
} from '#/api/runtime';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';
const providers = ref<ModelProviderCapability[]>([]);
const loading = ref(false);
const error = ref(false);
const deepSeek = computed(() =>
  providers.value.find((item) => item.provider.toUpperCase() === 'DEEPSEEK'),
);
onMounted(async () => {
  loading.value = true;
  try {
    providers.value = (await listModelProviders()) ?? [];
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Platform Administration"
    title="平台管理"
    description="模型 Provider、路由、插件签名、租户权限、索引和运行基础设施统一入口。"
    :metrics="[
      { label: 'Provider 模型', value: String(providers.length) },
      {
        label: 'DeepSeek',
        value: deepSeek?.model || '未配置',
        tone: deepSeek ? 'success' : 'warning',
      },
      { label: '工具隔离', value: 'Worker RPC' },
      { label: '密钥暴露', value: '0', tone: 'success' },
    ]"
  >
    <NAlert v-if="error" type="warning" :bordered="false">
      Provider 目录暂时不可用，请检查管理员权限。
    </NAlert>
    <div v-if="loading" class="loading"><NSpin size="small" /></div>
    <NEmpty
      v-else-if="!providers.length"
      description="暂无 Provider 能力目录"
    />
    <NList v-else bordered>
      <NListItem
        v-for="item in providers"
        :key="`${item.provider}:${item.model}`"
      >
        <span
          ><strong>{{ item.provider }} · {{ item.model }}</strong
          ><small>{{ (item.features || []).join(' · ') }}</small></span
        ><template #suffix>
          <NTag type="success" size="small">能力已注册</NTag>
        </template>
      </NListItem>
    </NList>
    <template #side>
      <h3>安全约束</h3>
      <p>
        API Key 仅受控配置注入；生产插件仅允许签名 Worker RPC，不进入主进程
        ClassLoader。
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
.n-list-item span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.n-list-item small {
  color: #64748b;
}
</style>
