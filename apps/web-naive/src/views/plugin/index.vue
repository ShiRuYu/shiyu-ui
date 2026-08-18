<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NAlert, NButton, NEmpty, NList, NListItem, NSpace, NTag } from 'naive-ui';
import { requestClient } from '#/api/request';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';

interface PluginSummary { id: string; name: string; version?: string; status?: string; signed?: boolean; }
const plugins = ref<PluginSummary[]>([]);
const error = ref(false);
onMounted(async () => {
  try { plugins.value = (await requestClient.get<PluginSummary[]>('/v1/plugins')) ?? []; }
  catch { error.value = true; }
});
</script>
<template>
  <PlatformWorkspaceShell eyebrow="Platform Governance" title="插件市场" description="插件必须经过来源、签名、权限清单和 Worker 隔离校验后才能启用。">
    <NAlert v-if="error" type="warning" :bordered="false">暂未发现可安装插件，请先配置受信任发布者或开发模式插件。</NAlert>
    <NEmpty v-else-if="!plugins.length" description="暂无可安装插件" />
    <NList v-else bordered>
      <NListItem v-for="plugin in plugins" :key="plugin.id"><NSpace justify="space-between" align="center" style="width:100%"><span><strong>{{ plugin.name }}</strong><small>{{ plugin.version || '未标记版本' }}</small></span><NSpace><NTag :type="plugin.signed ? 'success' : 'warning'">{{ plugin.signed ? '已签名' : '待校验' }}</NTag><NButton size="small">查看权限</NButton></NSpace></NSpace></NListItem>
    </NList>
  </PlatformWorkspaceShell>
</template>
<style scoped>small { display:block; color:#64748b; margin-top:4px; }</style>
