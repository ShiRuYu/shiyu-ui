<script lang="ts" setup>
import type { AgentApi } from '#/api/agent/agent';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NEmpty, NGrid, NGi, NSpin, NTag } from 'naive-ui';

import { deleteAgent, getAgentList } from '#/api/agent/agent';
import { message } from '#/adapter/naive';
import { $t } from '#/locales';

const agents = ref<AgentApi.AgentDefinition[]>([]);
const loading = ref(false);

async function loadAgents() {
  loading.value = true;
  try {
    agents.value = (await getAgentList()) || [];
  } finally {
    loading.value = false;
  }
}

async function onDelete(agentId: string) {
  await deleteAgent(agentId);
  message.success($t('ui.actionMessage.deleteSuccess', [agentId]));
  await loadAgents();
}

onMounted(() => {
  loadAgents();
});
</script>

<template>
  <Page auto-content-height>
    <NSpin :show="loading">
      <template v-if="agents.length === 0">
        <NEmpty :description="$t('common.noData')" />
      </template>
      <template v-else>
        <NGrid :cols="3" :x-gap="16" :y-gap="16" item-responsive>
          <NGi
            v-for="agent in agents"
            :key="agent.agentId"
            class="flex flex-col"
          >
            <NCard
              :content-style="{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
              }"
              :title="agent.name"
              class="flex flex-1 flex-col"
              size="small"
            >
              <template #header-extra>
                <NTag v-if="agent.currentVersion" size="small" type="info">
                  v{{ agent.currentVersion }}
                </NTag>
              </template>
              <p class="text-muted-foreground flex-1 text-sm">
                {{ agent.description || '-' }}
              </p>
              <div class="mt-3 flex gap-2">
                <NButton
                  size="small"
                  type="error"
                  @click="onDelete(agent.agentId)"
                >
                  {{ $t('common.delete') }}
                </NButton>
              </div>
            </NCard>
          </NGi>
        </NGrid>
      </template>
    </NSpin>
  </Page>
</template>
