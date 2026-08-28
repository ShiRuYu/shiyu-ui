<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/features/iam/api';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTenant, getTenantList } from '#/features/iam/api';
import { useDeleteConfirm } from '#/composables/useDeleteConfirm';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: SystemTenantApi.SystemTenant) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

const onDelete = useDeleteConfirm(deleteTenant, {
  onSuccess: refreshGrid,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemTenantApi.SystemTenant>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
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
          return await getTenantList(formValues);
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
    treeConfig: {
      childrenField: 'children',
      expandAll: false,
      reserve: true,
      rowField: 'id',
    },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}

function setAllExpanded(expanded: boolean) {
  gridApi.grid.setAllTreeExpand(expanded);
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('system.tenant.list')">
      <template #toolbar-tools>
        <NButton @click="setAllExpanded(true)">
          {{ $t('common.expandAll') }}
        </NButton>
        <NButton @click="setAllExpanded(false)">
          {{ $t('common.collapseAll') }}
        </NButton>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:tenant:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.tenant.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
