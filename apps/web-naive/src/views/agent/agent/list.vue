<script lang="ts" setup>
import type { AgentApi } from '#/api/agent/agent';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton, NCard, NEmpty, NGrid, NGi, NInput, NSpin, NTag } from 'naive-ui';

import { deleteAgent, getAgentList } from '#/api/agent/agent';
import { message } from '#/adapter/naive';
import { $t } from '#/locales';

import AgentChat from './modules/chat.vue';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [ChatModal, chatModalApi] = useVbenModal({
  connectedComponent: AgentChat,
  destroyOnClose: true,
});

const agents = ref<AgentApi.AgentDefinition[]>([]);
const loading = ref(false);
const searchKeyword = ref('');

const filteredAgents = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim();
  if (!keyword) return agents.value;
  return agents.value.filter(
    (a) =>
      a.name.toLowerCase().includes(keyword) ||
      a.agentId.toLowerCase().includes(keyword) ||
      (a.description || '').toLowerCase().includes(keyword),
  );
});

async function loadAgents() {
  loading.value = true;
  try {
    agents.value = (await getAgentList()) || [];
  } finally {
    loading.value = false;
  }
}

function onEdit(agent: AgentApi.AgentDefinition) {
  formModalApi.setData(agent).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onChat(agent: AgentApi.AgentDefinition) {
  chatModalApi.setData(agent).open();
}

async function onDelete(agent: AgentApi.AgentDefinition) {
  const hideLoading = message.loading('正在删除...', { duration: 0 });
  try {
    await deleteAgent(agent.agentId);
    message.success($t('ui.actionMessage.deleteSuccess', [agent.name]));
    await loadAgents();
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading.destroy();
  }
}

onMounted(() => {
  loadAgents();
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="loadAgents" />
    <ChatModal />
    <div class="mb-4 flex items-center justify-between">
      <NInput
        v-model:value="searchKeyword"
        :placeholder="$t('ui.placeholder.input')"
        clearable
        style="width: 300px"
      />
      <NButton type="primary" @click="onCreate">
        <Plus class="size-5" />
        {{ $t('ui.actionTitle.create', [$t('agent.name')]) }}
      </NButton>
    </div>
    <NSpin :show="loading">
      <template v-if="filteredAgents.length === 0">
        <NEmpty :description="$t('common.noData')" />
      </template>
      <template v-else>
        <NGrid :cols="3" :x-gap="16" :y-gap="16" item-responsive>
          <NGi
            v-for="agent in filteredAgents"
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
              <p class="text-muted-foreground mb-1 text-xs">
                {{ agent.agentId }}
              </p>
              <p class="text-muted-foreground flex-1 text-sm">
                {{ agent.description || '-' }}
              </p>
              <div class="mt-3 flex gap-2">
                <NButton
                  size="small"
                  type="primary"
                  @click="onChat(agent)"
                >
                  {{ $t('agent.chat') }}
                </NButton>
                <NButton
                  size="small"
                  @click="onEdit(agent)"
                >
                  {{ $t('common.edit') }}
                </NButton>
                <NButton
                  size="small"
                  type="error"
                  @click="onDelete(agent)"
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
