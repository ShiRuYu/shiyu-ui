<script lang="ts" setup>
import type { AgentAdminApi } from '#/api/agent/admin';
import type { AgentApi } from '#/api/agent/agent';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
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
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { deleteAgent, getAgentPage } from '#/api/agent/admin';
import { $t } from '#/locales';

import ChatModal from '../agent/modules/chat.vue';

const router = useRouter();

const [ChatModalComp, chatModalApi] = useVbenModal({
  connectedComponent: ChatModal,
  destroyOnClose: true,
});

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

function openChat(row: AgentAdminApi.AgentVO) {
  const agentDef: AgentApi.AgentDefinition = {
    agentId: row.agentId,
    name: row.name,
    description: row.description,
  };
  chatModalApi.setData(agentDef).open();
}

async function onDelete(row: AgentAdminApi.AgentVO) {
  const hideLoading = message.loading($t('agent.adminListDeleting'), {
    duration: 0,
  });
  try {
    await deleteAgent(row.id);
    message.success($t('agent.adminListDeleteSuccess', { name: row.name }));
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
  <div>
    <Page auto-content-height>
      <NSpace vertical :size="16">
        <!-- Search + New -->
        <NSpace align="center">
          <NInput
            v-model:value="searchName"
            clearable
            :placeholder="$t('agent.adminListSearchPlaceholder')"
            size="small"
            style="width: 240px"
            @keyup.enter="loadAgents"
          />
          <NButton size="small" @click="loadAgents">
            {{ $t('agent.adminListSearch') }}
          </NButton>
          <div class="flex-1"></div>
          <NButton type="primary" @click="onNewAgent" v-access:code="['agent:admin:create']">
        <Plus class="size-5" />
            {{ $t('agent.adminListCreate') }}
          </NButton>
        </NSpace>

        <!-- Card List -->
        <NSpin :show="loading">
          <template v-if="agents.length === 0">
            <NEmpty :description="$t('agent.adminListEmpty')" />
          </template>
          <NGrid v-else :cols="3" :x-gap="12" :y-gap="12">
            <NGi v-for="agent in agents" :key="agent.id">
              <NCard
                :bordered="true"
                size="small"
                style="border-left: 4px solid #2080f0"
              >
                <template #header>
                  <NTooltip :delay="300" style="max-width: 100%">
                    <template #trigger>
                      <span class="truncate block font-medium">{{
                        agent.name
                      }}</span>
                    </template>
                    {{ agent.name }}
                  </NTooltip>
                </template>
                <template #header-extra>
                  <NSpace align="center" size="small">
                    <NTag
                      :bordered="false"
                      :type="agent.status === '1' ? 'success' : 'error'"
                      size="tiny"
                    >
                      {{
                        agent.status === '1'
                          ? $t('agent.adminListStatusNormal')
                          : $t('agent.adminListStatusDisabled')
                      }}
                    </NTag>
                  </NSpace>
                </template>

                <div class="text-sm text-gray-500">
                  <div class="mb-1 truncate">
                    <span class="font-medium">{{
                      $t('agent.adminListIdLabel')
                    }}</span>
                    <NTooltip :delay="300" style="max-width: 100%">
                      <template #trigger>
                        <span>{{ agent.agentId }}</span>
                      </template>
                      {{ agent.agentId }}
                    </NTooltip>
                  </div>
                  <div class="mb-1">
                    <span class="font-medium">{{
                      $t('agent.adminListVersionLabel')
                    }}</span>{{ agent.currentVersion || '-' }}
                  </div>
                  <div v-if="agent.description" class="truncate text-xs">
                    <NTooltip :delay="300" style="max-width: 100%">
                      <template #trigger>
                        <span>{{ agent.description }}</span>
                      </template>
                      {{ agent.description }}
                    </NTooltip>
                  </div>
                </div>

                <template #footer>
                  <NSpace>
                    <NButton size="tiny" v-access:code="['agent:admin:list']" @click="onView(agent)">
                      {{ $t('agent.adminListView') }}
                    </NButton>
                    <NButton size="tiny" type="primary" v-access:code="['agent:admin:edit']" @click="onEdit(agent)">
                      {{ $t('agent.adminListEdit') }}
                    </NButton>
                    <NButton size="tiny" v-access:code="['agent:admin:list']" @click="openChat(agent)">
                      {{ $t('agent.chat') }}
                    </NButton>
                    <NPopconfirm @positive-click="onDelete(agent)">
                      <template #trigger>
                        <NButton size="tiny" type="error" v-access:code="['agent:admin:delete']">
                          {{ $t('agent.adminListDelete') }}
                        </NButton>
                      </template>
                      {{
                        $t('agent.adminListConfirmDelete', { name: agent.name })
                      }}
                    </NPopconfirm>
                  </NSpace>
                </template>
              </NCard>
            </NGi>
          </NGrid>
        </NSpin>
      </NSpace>
    </Page>
    <ChatModalComp />
  </div>
</template>
