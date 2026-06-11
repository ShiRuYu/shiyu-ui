<script lang="ts" setup>
import type { AgentAdminApi } from '#/api/agent/admin';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  NButton,
  NCard,
  NEmpty,
  NGi,
  NGrid,
  NInput,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { deleteAgent, getAgentPage } from '#/api/agent/admin';

const router = useRouter();

const loading = ref(false);
const agents = ref<AgentAdminApi.AgentVO[]>([]);
const searchName = ref('');
const total = ref(0);

async function loadAgents() {
  loading.value = true;
  try {
    const res = await getAgentPage({
      name: searchName.value || undefined,
      page: 1,
      pageSize: 100,
    });
    agents.value = res?.items || [];
    total.value = res?.total || 0;
  } finally {
    loading.value = false;
  }
}

onMounted(loadAgents);

function onView(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/agent/admin/edit',
    query: { id: row.id, readonly: 'true' },
  });
}

function onEdit(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/agent/admin/edit',
    query: { id: row.id },
  });
}

function onSyncChat(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/agent/agent/chat',
    query: { agentId: row.agentId, mode: 'sync' },
  });
}

function onStreamChat(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/agent/agent/chat',
    query: { agentId: row.agentId, mode: 'stream' },
  });
}

async function onDelete(row: AgentAdminApi.AgentVO) {
  const hideLoading = message.loading('正在删除...', { duration: 0 });
  try {
    await deleteAgent(row.id);
    message.success(`删除成功: ${row.name}`);
    await loadAgents();
  } finally {
    hideLoading.destroy();
  }
}

function onNewAgent() {
  router.push({
    path: '/agent/admin/edit',
    query: { new: 'true' },
  });
}

function statusTag(s: string) {
  return s === '1' ? 'success' : 'error';
}
</script>

<template>
  <Page auto-content-height>
    <NSpace vertical :size="16">
      <!-- Search + New -->
      <NSpace align="center">
        <NInput
          v-model:value="searchName"
          clearable
          placeholder="搜索 Agent 名称..."
          size="small"
          style="width: 240px"
          @keyup.enter="loadAgents"
        />
        <NButton size="small" @click="loadAgents">搜索</NButton>
        <div class="flex-1" />
        <NButton type="primary" @click="onNewAgent">
          <Plus class="size-5" />
          新增 Agent
        </NButton>
      </NSpace>

      <!-- Card List -->
      <NSpin :show="loading">
        <template v-if="agents.length === 0">
          <NEmpty description="暂无 Agent" />
        </template>
        <NGrid v-else :cols="3" :x-gap="12" :y-gap="12">
          <NGi v-for="agent in agents" :key="agent.id">
            <NCard
              :bordered="true"
              :title="agent.name"
              size="small"
              style="border-left: 4px solid #2080f0"
            >
              <template #header-extra>
                <NSpace align="center" size="small">
                  <NTag :bordered="false" :type="agent.status === '1' ? 'success' : 'error'" size="tiny">
                    {{ agent.status === '1' ? '正常' : '停用' }}
                  </NTag>
                </NSpace>
              </template>

              <div class="text-sm text-gray-500">
                <div class="mb-1">
                  <span class="font-medium">标识：</span>{{ agent.agentId }}
                </div>
                <div class="mb-1">
                  <span class="font-medium">版本：</span>{{ agent.currentVersion || '-' }}
                </div>
                <div v-if="agent.description" class="line-clamp-2 text-xs">
                  {{ agent.description }}
                </div>
              </div>

              <template #footer>
                <NSpace>
                  <NButton size="tiny" @click="onView(agent)">查看</NButton>
                  <NButton size="tiny" type="primary" @click="onEdit(agent)">修改</NButton>
                  <NButton size="tiny" @click="onSyncChat(agent)">对话(同步)</NButton>
                  <NButton size="tiny" @click="onStreamChat(agent)">对话(流式)</NButton>
                  <NPopconfirm @positive-click="onDelete(agent)">
                    <template #trigger>
                      <NButton size="tiny" type="error">删除</NButton>
                    </template>
                    确认删除 <b>{{ agent.name }}</b>？
                  </NPopconfirm>
                </NSpace>
              </template>
            </NCard>
          </NGi>
        </NGrid>
      </NSpin>
    </NSpace>
  </Page>
</template>
