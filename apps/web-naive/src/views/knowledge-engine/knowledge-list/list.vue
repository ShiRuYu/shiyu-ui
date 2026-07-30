<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { GitBranch, Network, Plus } from '@vben/icons';

import { NButton, NSpace } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteKnowledgeApi, getKnowledgeListApi } from '#/api/knowledge';
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
    .catch((error: any) => {
      message.error(error.message || $t('ui.actionMessage.deleteFailed'));
    })
    .finally(() => h.destroy());
}
function onActionClick({ code, row }: OnActionClickParams<any>) {
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
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params: any = {
            page: page.currentPage,
            pageSize: page.pageSize,
          };
          if (formValues?.keyword) params.keyword = formValues.keyword;
          if (formValues?.category) params.category = formValues.category;
          const result = await getKnowledgeListApi(params);
          return {
            items: result?.items || result,
            total: result?.total || (result?.items || result)?.length || 0,
          };
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
