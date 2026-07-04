<script lang="ts" setup>
import type { IntentDefApi } from '#/api/agent/intent-def';

import { useVbenModal } from '@vben/common-ui';
import { Page } from '@vben/common-ui';
import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { message } from '#/adapter/naive';
import { deleteIntentDef, getIntentDefPage } from '#/api/agent/intent-def';
import { Plus } from '@vben/icons';
import { NButton } from 'naive-ui';

import Form from './modules/form.vue';
import { useColumns, useGridFormSchema, initCategoryLabelMap } from './data';

// 预加载分类字典映射
initCategoryLabelMap();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: IntentDefApi.IntentDefVO) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

async function onDelete(row: IntentDefApi.IntentDefVO) {
  const hide = message.loading($t('agent.adminListDeleting'), { duration: 0 });
  try {
    await deleteIntentDef(row.id);
    message.success($t('agent.intentListDeleteSuccess'));
    refreshGrid();
  } finally {
    hide.destroy();
  }
}

function onActionClick({ code, row }: any) {
  switch (code) {
    case 'edit': onEdit(row); break;
    case 'delete': onDelete(row); break;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async (params: any, formValues: any) => {
          const search = Object.fromEntries(
            Object.entries(formValues || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined),
          );
          return await getIntentDefPage({
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
  },
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('agent.intentListTitle')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('agent.intentListCreate') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
