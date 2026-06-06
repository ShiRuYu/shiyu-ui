<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import type { AgentDefinition } from '#/api/agent';

import { deleteAgentApi, getAgentListApi } from '#/api/agent';

const router = useRouter();

const loading = ref(false);
const agentList = ref<AgentDefinition[]>([]);

async function fetchAgents() {
  loading.value = true;
  try {
    const res = await getAgentListApi();
    agentList.value = res as any;
  } catch (e: any) {
    message.error(e?.message || '获取 Agent 列表失败');
  } finally {
    loading.value = false;
  }
}

function handleChat(agent: AgentDefinition) {
  router.push({ name: 'AgentChat', params: { agentId: agent.agentId } });
}

async function handleDelete(agent: AgentDefinition) {
  try {
    await deleteAgentApi(agent.agentId);
    message.success('删除成功');
    await fetchAgents();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

onMounted(fetchAgents);
</script>

<template>
  <div class="p-5">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold">Agent 列表</h2>
      <a-button type="primary" :loading="loading" @click="fetchAgents">
        刷新
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <a-empty v-if="agentList.length === 0" description="暂无已注册的 Agent" />

      <a-row v-else :gutter="[16, 16]">
        <a-col
          v-for="agent in agentList"
          :key="agent.agentId"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a-card hoverable>
            <template #title>
              <div class="flex items-center gap-2">
                <span class="text-base font-semibold">{{ agent.name }}</span>
                <a-tag color="blue">{{ agent.currentVersion || 'v1.0.0' }}</a-tag>
              </div>
            </template>
            <template #actions>
              <a-button type="link" size="small" @click="handleChat(agent)">
                调用
              </a-button>
              <a-popconfirm
                title="确认删除该 Agent？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="handleDelete(agent)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </template>

            <p class="text-gray-500 text-sm mb-2">
              <span class="font-medium">ID：</span>{{ agent.agentId }}
            </p>
            <p class="text-gray-500 text-sm mb-3">
              {{ agent.description || '暂无描述' }}
            </p>

            <div v-if="agent.versions?.length" class="text-xs text-gray-400">
              版本数：{{ agent.versions.length }}
            </div>
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>
