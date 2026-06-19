<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RecordsApi } from '#/api/record/records';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRecord, getRecordPage } from '#/api/record/records';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
function onEdit(row: RecordsApi.Record) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onDelete(row: RecordsApi.Record) {
  const h = message.loading('正在删除...', { duration: 0 });
  deleteRecord(row.id)
    .then(() => {
      message.success('删除成功');
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({ code, row }: OnActionClickParams<RecordsApi.Record>) {
  if (code === 'delete') onDelete(row);
  else if (code === 'edit') onEdit(row);
}
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
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
          return await getRecordPage({
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
    <Grid :table-title="$t('record.records.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />{{
            $t('ui.actionTitle.create', [$t('record.records.name')])
          }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
