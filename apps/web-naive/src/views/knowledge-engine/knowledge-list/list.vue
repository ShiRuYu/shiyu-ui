<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { NButton } from 'naive-ui';
import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';
import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({ connectedComponent: Form, destroyOnClose: true });
function onEdit(row: any) { formModalApi.setData(row).open(); }
function onCreate() { formModalApi.setData({}).open(); }
function onDelete(row: any) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  Promise.resolve().then(() => { message.success($t('ui.actionMessage.deleteSuccess', [row.name])); refreshGrid(); }).finally(() => h.destroy());
}
function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) { case 'edit': onEdit(row); break; case 'delete': onDelete(row); break; }
}
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick), height: 'auto', keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async () => ({ items: [], total: 0 }),
      },
    },
    toolbarConfig: { custom: true, export: false, refresh: true, search: true, zoom: true },
  } as VxeTableGridOptions,
});
function refreshGrid() { gridApi.query(); }
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('knowledge.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" /> {{ $t('ui.actionTitle.create', [$t('knowledge.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
