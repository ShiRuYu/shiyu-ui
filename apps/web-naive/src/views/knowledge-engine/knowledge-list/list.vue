<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, GitBranch, Network } from '@vben/icons';

import { NButton, NSpace } from 'naive-ui';
import { useRouter } from 'vue-router';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeListApi,
  deleteKnowledgeApi,
} from '#/api/knowledge';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
function onEdit(row: any) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onDelete(row: any) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deleteKnowledgeApi(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
    })
    .catch((err: any) => {
      message.error(err.message || '删除失败');
    })
    .finally(() => h.destroy());
}
function onActionClick({ code, row }: OnActionClickParams<any>) {
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
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async ({ formValues }) => {
          const params: any = { pageNum: 1, pageSize: 1000 };
          if (formValues?.keyword) params.keyword = formValues.keyword;
          if (formValues?.category) params.category = formValues.category;
          const result = await getKnowledgeListApi(params);
          return { items: result, total: result.length };
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

function goToGraph() {
  router.push('/knowledge/graph');
}

function goToRelation() {
  router.push('/knowledge/relation');
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('knowledge.list')">
      <template #toolbar-tools>
        <NSpace>
          <NButton @click="goToGraph">
            <template #icon><GitBranch class="size-4" /></template>
            {{ $t('knowledge.viewGraph') }}
          </NButton>
          <NButton @click="goToRelation">
            <template #icon><Network class="size-4" /></template>
            {{ $t('knowledge.addRelation') }}
          </NButton>
          <NButton type="primary" @click="onCreate">
            <template #icon><Plus class="size-5" /></template>
            {{ $t('ui.actionTitle.create', [$t('knowledge.name')]) }}
          </NButton>
        </NSpace>
      </template>
    </Grid>
  </Page>
</template>
