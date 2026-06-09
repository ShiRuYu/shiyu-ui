<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AgentAdminApi } from '#/api/agent/admin';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAgent, getAgentPage } from '#/api/agent/admin';

import Form from './agent-form.vue';
import { useColumns, useGridFormSchema } from './data';

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: AgentAdminApi.AgentVO) {
  router.push({
    path: '/agent/admin/edit',
    query: { id: row.id },
  });
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: AgentAdminApi.AgentVO) {
  const hideLoading = message.loading('正在删除...', { duration: 0 });
  deleteAgent(row.id)
    .then(() => {
      message.success(`删除成功: ${row.name}`);
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<AgentAdminApi.AgentVO>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'version': {
      router.push({
        path: '/agent/admin/edit',
        query: { id: row.id },
      });
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
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async (params, formValues) => {
          const search = Object.fromEntries(
            Object.entries(formValues || {}).filter(
              ([, v]) => v !== '' && v !== null && v !== undefined,
            ),
          );
          return await getAgentPage({
            page: params.page?.currentPage || 1,
            pageSize: params.page?.pageSize || 10,
            ...search,
          });
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
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="Agent 管理">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增 Agent
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
