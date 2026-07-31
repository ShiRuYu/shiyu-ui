<script lang="ts" setup>
import type { UploadCustomRequestOptions } from 'naive-ui';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton, NUpload } from 'naive-ui';
import { storeToRefs } from 'pinia';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from '#/api/knowledge/enterprise';
import { $t } from '#/locales';
import { useKnowledgeStore } from '#/store';

import { useColumns, useGridFormSchema } from './data';
const knowledgeStore = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(knowledgeStore);
function onDelete(row: any) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deleteDocument(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({ code, row }: OnActionClickParams<any>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}
async function onUpload({ file }: UploadCustomRequestOptions) {
  if (!activeSpaceId.value || !file.file) return;
  await uploadDocument(activeSpaceId.value, file.file);
  message.success($t('ui.actionMessage.operationSuccess'));
  refreshGrid();
}
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!knowledgeStore.spaces.length) {
            await knowledgeStore.loadSpaces();
          }
          if (!activeSpaceId.value) {
            return { items: [], total: 0 };
          }
          const result = await getDocuments(activeSpaceId.value, {
            pageNum: 1,
            pageSize: 100,
          });
          return {
            items: result.items,
            total: result.total,
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
</script>
<template>
  <Page auto-content-height>
    <Grid :table-title="$t('knowledge.document')">
      <template #toolbar-tools>
        <NUpload :custom-request="onUpload" :show-file-list="false">
          <NButton type="primary" v-access:code="['knowledge:document:upload']">
            <Plus class="size-5" />
            上传文档
          </NButton>
        </NUpload>
      </template>
    </Grid>
  </Page>
</template>
