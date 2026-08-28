<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { DictApi } from '#/features/iam/api';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton, NPopconfirm } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { batchDeleteDict, deleteDict, getDictPage } from '#/features/iam/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const selectedIds = ref<number[]>([]);

function onEdit(row: DictApi.DictItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: DictApi.DictItem) {
  const hideLoading = message.loading($t('common.deleting'), { duration: 0 });
  deleteDict(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.dictLabel]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

async function onBatchDelete() {
  if (selectedIds.value.length === 0) {
    message.warning($t('system.dict.selectFirst'));
    return;
  }
  const hideLoading = message.loading($t('system.dict.batchDeleting'), {
    duration: 0,
  });
  try {
    await batchDeleteDict(selectedIds.value);
    message.success(
      $t('system.dict.batchDeleteSuccess', [selectedIds.value.length]),
    );
    selectedIds.value = [];
    refreshGrid();
  } catch {
    // handled by request interceptor
  } finally {
    hideLoading.destroy();
  }
}

function onActionClick({ code, row }: OnActionClickParams<DictApi.DictItem>) {
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

function onSelectChange(data: { records: any[] }) {
  selectedIds.value = data.records.map((r: any) => r.id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridEvents: {
    checkboxChange: onSelectChange,
    checkboxAll: onSelectChange,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    scrollY: { enabled: true },
    minHeight: 300,
    proxyConfig: {
      ajax: {
        query: async (params, formValues) => {
          const search = Object.fromEntries(
            Object.entries(formValues || {}).filter(
              ([, v]) => v !== '' && v !== null && v !== undefined,
            ),
          );
          return await getDictPage({
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
    <Grid :table-title="$t('system.dict.list')">
      <template #toolbar-tools>
        <NPopconfirm @positive-click="onBatchDelete">
          <template #trigger>
            <NButton type="error" :disabled="selectedIds.length === 0">
              {{ $t('system.dict.batchDelete') }}
            </NButton>
          </template>
          {{ $t('system.dict.batchDeleteConfirm', [selectedIds.length]) }}
        </NPopconfirm>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:dict:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dict.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
