<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NEmpty, NList, NListItem, NTag, NSpace } from 'naive-ui';
import { PlatformWorkspaceShell } from '#/shared';
import { listRuntimeApprovals } from '#/features/agent';
import type { RuntimeApproval } from '#/features/agent';

const approvals = ref<RuntimeApproval[]>([]);
onMounted(async () => {
  approvals.value = (await listRuntimeApprovals()) ?? [];
});
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Governance"
    title="工具审批"
    description="统一处理高风险工具调用，并保留审批、拒绝、超时和越权审计。"
  >
    <NEmpty v-if="!approvals.length" description="暂无待审批工具调用" />
    <NList v-else bordered>
      <NListItem v-for="item in approvals" :key="item.id"
        ><NSpace justify="space-between" style="width: 100%"
          ><span>{{ item.toolName || item.id }}</span
          ><NTag>{{ item.status }}</NTag></NSpace
        ></NListItem
      >
    </NList>
  </PlatformWorkspaceShell>
</template>
