<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { ModelApi } from '#/api/common/model';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteModel, getModelPage, setDefaultModel } from '#/api/common/model';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import ChatDialog from './modules/chat-dialog.vue';
import Form from './modules/form.vue';

const [ChatModal, chatModalApi] = useVbenModal({
  connectedComponent: ChatDialog,
  destroyOnClose: true,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: ModelApi.ModelItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: ModelApi.ModelItem) {
  const hideLoading = message.loading($t('agent.modelDeleting'), {
    duration: 0,
  });
  deleteModel(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.modelName]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

function onChat(row: ModelApi.ModelItem) {
  chatModalApi.setData(row).open();
}

async function onSetDefault(row: ModelApi.ModelItem) {
  try {
    await setDefaultModel(row.id);
    message.success($t('agent.modelSetDefault', { name: row.modelName }));
    refreshGrid();
  } catch {
    // handled by request interceptor
  }
}

function onActionClick({ code, row }: OnActionClickParams<ModelApi.ModelItem>) {
  switch (code) {
    case 'chat': {
      onChat(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'setDefault': {
      onSetDefault(row);
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
          return await getModelPage({
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
    <ChatModal />
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('system.model.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate" v-access:code="['agent:model:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.model.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
