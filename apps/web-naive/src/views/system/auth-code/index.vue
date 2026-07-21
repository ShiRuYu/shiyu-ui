<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AuthCodeApi } from '#/api/system/auth-code';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAuthCode, getAuthCodeList } from '#/api/system/auth-code';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: AuthCodeApi.AuthCodeItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: AuthCodeApi.AuthCodeItem) {
  const hideLoading = message.loading($t('common.deleting'), { duration: 0 });
  deleteAuthCode(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => hideLoading.destroy());
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<AuthCodeApi.AuthCodeItem>) {
  switch (code) {
    case 'delete':
      onDelete(row);
      break;
    case 'edit':
      onEdit(row);
      break;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          const data = await getAuthCodeList();
          return { items: data || [], total: (data || []).length };
        },
      },
    },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('system.authCode.title')">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:auth-code:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.authCode.title')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
