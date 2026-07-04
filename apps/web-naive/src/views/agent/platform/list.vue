<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { PlatformApi } from '#/api/common/platform';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePlatform,
  getPlatformPage,
  reloadPlatforms,
  setDefaultPlatform,
} from '#/api/common/platform';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: PlatformApi.PlatformItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: PlatformApi.PlatformItem) {
  const hideLoading = message.loading($t('agent.platformDeleting'), { duration: 0 });
  deletePlatform(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

async function onReload() {
  try {
    await reloadPlatforms();
    message.success($t('ui.actionMessage.operationSuccess'));
  } catch {
    // handled by request interceptor
  }
}

async function onSetDefault(row: PlatformApi.PlatformItem) {
  try {
    await setDefaultPlatform(row.id);
    message.success($t('agent.platformSetDefault', { name: row.name }));
    refreshGrid();
  } catch {
    // handled by request interceptor
  }
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<PlatformApi.PlatformItem>) {
  switch (code) {
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
          return await getPlatformPage({
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
    <Grid :table-title="$t('system.platform.list')">
      <template #toolbar-tools>
        <NButton type="info" class="mr-2" @click="onReload">
          {{ $t('system.platform.reload') }}
        </NButton>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.platform.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
