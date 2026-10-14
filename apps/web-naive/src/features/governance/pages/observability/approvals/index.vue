<script setup lang="ts">
import type { RuntimeApproval } from '#/features/agent';

import { onMounted, onUnmounted, ref } from 'vue';

import {
  NAlert,
  NButton,
  NEmpty,
  NList,
  NListItem,
  NSpace,
  NTag,
} from 'naive-ui';

import {
  approveAndResumeTool,
  listRuntimeApprovals,
  rejectAndCancelTool,
} from '#/features/agent';
import { PlatformWorkspaceShell } from '#/shared';

const approvals = ref<RuntimeApproval[]>([]);
const error = ref(false);
const actionError = ref('');
const busyId = ref<null | string>(null);
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

async function decide(item: RuntimeApproval, approved: boolean) {
  if (busyId.value) return;
  busyId.value = item.id;
  actionError.value = '';
  try {
    if (approved) await approveAndResumeTool(item.id);
    else await rejectAndCancelTool(item.id);
  } catch {
    actionError.value = approved
      ? '审批已提交时可能仍需继续执行，请刷新列表后重试。'
      : '拒绝操作未完成，请刷新列表后重试。';
  } finally {
    busyId.value = null;
    await loadApprovals();
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
    <NAlert v-if="actionError" type="warning" :bordered="false">
      {{ actionError }}
    </NAlert>
    <NEmpty v-if="!approvals.length" description="暂无待审批工具调用" />
    <NList v-else bordered>
      <NListItem v-for="item in approvals" :key="item.id">
        <NSpace justify="space-between" style="width: 100%">
          <span>{{ item.toolName || item.id }}</span>
          <NSpace align="center">
            <NTag>{{ item.status }}</NTag>
            <NButton
              v-if="
                item.status === 'PENDING' ||
                item.status === 'APPROVED' ||
                item.status === 'CLAIMED'
              "
              size="small"
              type="primary"
              :loading="busyId === item.id"
              :disabled="!!busyId && busyId !== item.id"
              @click="decide(item, true)"
            >
              {{
                item.status === 'CLAIMED'
                  ? '同步结果'
                  : item.status === 'APPROVED'
                    ? '继续执行'
                    : '批准并继续'
              }}
            </NButton>
            <NButton
              v-if="item.status === 'PENDING' || item.status === 'EXPIRED'"
              size="small"
              :disabled="!!busyId"
              @click="decide(item, false)"
            >
              {{ item.status === 'EXPIRED' ? '取消执行' : '拒绝' }}
            </NButton>
          </NSpace>
        </NSpace>
      </NListItem>
    </NList>
  </PlatformWorkspaceShell>
</template>
