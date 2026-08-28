<script lang="ts" setup>
import type { AgentAdminApi } from '#/features/agent/api';
import type { AgentApi } from '#/features/agent/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  NButton,
  NCard,
  NGi,
  NGrid,
  NInput,
  NPagination,
  NPopconfirm,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { deleteAdminAgent, getAdminAgentPage } from '#/features/agent/api';
import BusinessEmptyState from '#/shared/ui/business-empty-state.vue';
import FilterBar from '#/shared/ui/filter-bar.vue';
import { $t } from '#/locales';

import { AgentChatModal as ChatModal } from '#/features/agent/ui';

const router = useRouter();

const [ChatModalComp, chatModalApi] = useVbenModal({
  connectedComponent: ChatModal,
  destroyOnClose: true,
});

const loading = ref(false);
const agents = ref<AgentAdminApi.AgentVO[]>([]);
const searchName = ref('');
const total = ref(0);
const page = ref(1);
const pageSize = ref(12);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize.value)),
);

async function loadAgents() {
  loading.value = true;
  try {
    const res = await getAdminAgentPage({
      name: searchName.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
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
    path: '/app-studio/agents/edit',
    query: { id: row.id, readonly: 'true' },
  });
}

function onEdit(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/app-studio/agents/edit',
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
    await deleteAdminAgent(row.id);
    message.success($t('agent.adminListDeleteSuccess', { name: row.name }));
    await loadAgents();
  } finally {
    hideLoading.destroy();
  }
}

function onNewAgent() {
  router.push({
    path: '/app-studio/agents/edit',
    query: { new: 'true' },
  });
}

function onSearch() {
  page.value = 1;
  void loadAgents();
}

function onPageChange(value: number) {
  page.value = value;
  void loadAgents();
}

function onPageSizeChange(value: number) {
  pageSize.value = value;
  page.value = 1;
  void loadAgents();
}
</script>

<template>
  <div>
    <Page auto-content-height>
      <NSpace vertical :size="16">
        <FilterBar :aria-label="$t('agent.adminListFilterLabel')">
          <NInput
            v-model:value="searchName"
            clearable
            :placeholder="$t('agent.adminListSearchPlaceholder')"
            size="small"
            class="agent-search"
            @keyup.enter="onSearch"
          />
          <NButton size="small" @click="onSearch">
            {{ $t('agent.adminListSearch') }}
          </NButton>
          <template #actions>
            <NButton
              type="primary"
              @click="onNewAgent"
              v-access:code="['agent:admin:create']"
            >
              <Plus class="size-5" />
              {{ $t('agent.adminListCreate') }}
            </NButton>
          </template>
        </FilterBar>

        <!-- Card List -->
        <NSpin :show="loading">
          <template v-if="agents.length === 0">
            <BusinessEmptyState :description="$t('agent.adminListEmpty')">
              <NButton
                type="primary"
                @click="onNewAgent"
                v-access:code="['agent:admin:create']"
              >
                {{ $t('agent.adminListCreate') }}
              </NButton>
            </BusinessEmptyState>
          </template>
          <NGrid
            v-else
            cols="1 s:2 l:3"
            responsive="screen"
            :x-gap="12"
            :y-gap="12"
          >
            <NGi v-for="agent in agents" :key="agent.id">
              <NCard :bordered="true" size="small" class="agent-card">
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
                      :type="agent.status === 1 ? 'success' : 'error'"
                      size="tiny"
                    >
                      {{
                        agent.status === 1
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
                    }}</span
                    >{{ agent.currentVersion || '-' }}
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
                  <NSpace class="agent-actions" :wrap="true">
                    <NButton
                      size="tiny"
                      v-access:code="['agent:admin:list']"
                      @click="onView(agent)"
                    >
                      {{ $t('agent.adminListView') }}
                    </NButton>
                    <NButton
                      size="tiny"
                      type="primary"
                      v-access:code="['agent:admin:edit']"
                      @click="onEdit(agent)"
                    >
                      {{ $t('agent.adminListEdit') }}
                    </NButton>
                    <NButton
                      size="tiny"
                      v-access:code="['agent:admin:list']"
                      @click="openChat(agent)"
                    >
                      {{ $t('agent.chat') }}
                    </NButton>
                    <NPopconfirm @positive-click="onDelete(agent)">
                      <template #trigger>
                        <NButton
                          size="tiny"
                          type="error"
                          v-access:code="['agent:admin:delete']"
                        >
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

        <NPagination
          v-if="total > 0"
          :page="page"
          :page-count="pageCount"
          :page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          show-size-picker
          class="justify-end"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </NSpace>
    </Page>
    <ChatModalComp />
  </div>
</template>

<style scoped>
.agent-search {
  width: min(100%, 20rem);
}

.agent-card {
  height: 100%;
  border-inline-start: 4px solid hsl(var(--primary));
}

@media (max-width: 639px) {
  .agent-search {
    flex: 1;
    min-width: 0;
  }

  .agent-actions :deep(.n-button) {
    flex: 1;
  }
}
</style>
