<script setup lang="ts">
import type { RuntimeApproval } from '#/features/agent';

import { onMounted, onUnmounted, ref } from 'vue';

import { NAlert, NEmpty, NList, NListItem, NSpace, NTag } from 'naive-ui';

import { listRuntimeApprovals } from '#/features/agent';
import { PlatformWorkspaceShell } from '#/shared';

const approvals = ref<RuntimeApproval[]>([]);
const error = ref(false);
let disposed = false;
let latestRequestId = 0;

async function loadApprovals() {
  const requestId = ++latestRequestId;
  error.value = false;
  try {
    const result = (await listRuntimeApprovals()) ?? [];
    if (disposed || requestId !== latestRequestId) return;
    approvals.value = result;
  } catch {
    if (disposed || requestId !== latestRequestId) return;
    error.value = true;
  }
}

onMounted(() => void loadApprovals());
onUnmounted(() => {
  disposed = true;
  latestRequestId += 1;
});
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Governance"
    title="工具审批"
    description="统一处理高风险工具调用，并保留审批、拒绝、超时和越权审计。"
  >
    <NAlert v-if="error" type="warning" :bordered="false">
      审批列表暂时不可用，请稍后重试。
    </NAlert>
    <NEmpty v-if="!approvals.length" description="暂无待审批工具调用" />
    <NList v-else bordered>
      <NListItem v-for="item in approvals" :key="item.id">
        <NSpace justify="space-between" style="width: 100%">
          <span>{{ item.toolName || item.id }}</span
          ><NTag>{{ item.status }}</NTag>
        </NSpace>
      </NListItem>
    </NList>
  </PlatformWorkspaceShell>
</template>
