<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { AgentApi } from '#/api/agent/agent';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAgent, getAgentList } from '#/api/agent/agent';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
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

function onEdit(row: AgentApi.AgentDefinition) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onChat(row: AgentApi.AgentDefinition) {
  chatModalApi.setData(row).open();
}

async function onDelete(row: AgentApi.AgentDefinition) {
  const hideLoading = message.loading('正在删除...', { duration: 0 });
  try {
    await deleteAgent(row.agentId);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    refreshGrid();
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading.destroy();
  }
}

function onActionClick({ code, row }: OnActionClickParams<AgentApi.AgentDefinition>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'chat': {
      onChat(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const allAgents = (await getAgentList()) || [];
          const keyword = formValues?.keyword?.toLowerCase() || '';
          const filtered = keyword
            ? allAgents.filter(
                (a) =>
                  a.name.toLowerCase().includes(keyword) ||
                  a.agentId.toLowerCase().includes(keyword) ||
                  (a.description || '').toLowerCase().includes(keyword),
              )
            : allAgents;
          return { items: filtered, total: filtered.length };
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <ChatModal />
    <Grid :table-title="$t('agent.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('agent.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
