<script setup lang="ts">
import type { RuntimeApproval } from '#/features/agent';

import { onMounted, onUnmounted, ref } from 'vue';

import {
  NAlert,
  NButton,
  NEmpty,
  NList,
  NListItem,
  NPopconfirm,
  NSpace,
  NTag,
} from 'naive-ui';

import {
  approveAndResumeTool,
  confirmClaimedToolNotExecuted,
  confirmClaimedToolSuccess,
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

function formatApprovalArguments(value?: string) {
  if (!value) return '{}';
  try {
    const parsed = JSON.parse(value) as { summary?: unknown };
    const summary =
      typeof parsed.summary === 'string'
        ? JSON.parse(parsed.summary)
        : parsed.summary;
    return JSON.stringify(summary ?? parsed, null, 2);
  } catch {
    return value;
  }
}

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

async function confirmClaimedSuccess(item: RuntimeApproval) {
  if (busyId.value) return;
  busyId.value = item.id;
  actionError.value = '';
  try {
    await confirmClaimedToolSuccess(item.id);
  } catch {
    actionError.value =
      '无法完成核对。请确认运行已结束，并且外部系统已确认操作成功。';
  } finally {
    busyId.value = null;
    await loadApprovals();
  }
}

async function confirmClaimedNotExecuted(item: RuntimeApproval) {
  if (busyId.value) return;
  busyId.value = item.id;
  actionError.value = '';
  try {
    await confirmClaimedToolNotExecuted(item.id);
  } catch {
    actionError.value =
      '无法完成核对。请确认运行已结束，并且外部系统已确认操作未产生副作用。';
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
          <div style="flex: 1; min-width: 0">
            <strong>{{ item.toolName || item.id }}</strong>
            <div>调用参数（敏感字段已脱敏）</div>
            <pre style="overflow-wrap: anywhere; white-space: pre-wrap">{{
              formatApprovalArguments(item.argumentsRedacted)
            }}</pre>
          </div>
          <NSpace align="center">
            <NTag>{{ item.status }}</NTag>
            <NButton
              v-if="item.status === 'PENDING' || item.status === 'APPROVED'"
              size="small"
              type="primary"
              :loading="busyId === item.id"
              :disabled="!!busyId && busyId !== item.id"
              @click="decide(item, true)"
            >
              {{ item.status === 'APPROVED' ? '继续执行' : '批准并继续' }}
            </NButton>
            <NButton
              v-if="item.status === 'PENDING' || item.status === 'EXPIRED'"
              size="small"
              :disabled="!!busyId"
              @click="decide(item, false)"
            >
              {{ item.status === 'EXPIRED' ? '取消执行' : '拒绝' }}
            </NButton>
            <NPopconfirm
              v-if="item.status === 'CLAIMED'"
              positive-text="已核实成功"
              negative-text="返回"
              @positive-click="confirmClaimedSuccess(item)"
            >
              <template #trigger>
                <NButton
                  size="small"
                  type="warning"
                  :loading="busyId === item.id"
                  :disabled="!!busyId && busyId !== item.id"
                >
                  核实成功并关闭
                </NButton>
              </template>
              仅当运行已结束且你已在外部系统确认操作成功时使用。此操作不会重新执行工具。
            </NPopconfirm>
            <NPopconfirm
              v-if="item.status === 'CLAIMED'"
              positive-text="确认未执行"
              negative-text="返回"
              @positive-click="confirmClaimedNotExecuted(item)"
            >
              <template #trigger>
                <NButton
                  size="small"
                  type="error"
                  :loading="busyId === item.id"
                  :disabled="!!busyId && busyId !== item.id"
                >
                  核实未执行并关闭
                </NButton>
              </template>
              仅当运行已结束且你已在外部系统确认操作没有产生副作用时使用。
            </NPopconfirm>
          </NSpace>
        </NSpace>
      </NListItem>
    </NList>
  </PlatformWorkspaceShell>
</template>
