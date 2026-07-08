<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenu, getMenuListForGrid } from '#/api/system/menu';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/**
 * 编辑菜单
 * @param row
 */
function onEdit(row: SystemMenuApi.SystemMenu) {
  formModalApi.setData(row).open();
}

/**
 * 创建新菜单
 */
function onCreate() {
  formModalApi.setData(null).open();
}

/**
 * 新增下级菜单
 * @param row
 */
function onAppend(row: SystemMenuApi.SystemMenu) {
  formModalApi.setData({ pid: row.id }).open();
}

/**
 * 删除菜单
 * @param row
 */
function onDelete(row: SystemMenuApi.SystemMenu) {
  const hideLoading = message.loading($t('common.deleting'), {
    duration: 0,
  });
  deleteMenu(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

/**
 * 表格操作按钮的回调函数
 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemMenuApi.SystemMenu>) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
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
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          return await getMenuListForGrid();
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      lazy: false,
      parentField: 'pid',
      rowField: 'id',
      transform: false,
      expandAll: false,
    },
  } as VxeTableGridOptions,
});

/**
 * 刷新表格
 */
function refreshGrid() {
  gridApi.query();
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('system.menu.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.menu.name')]) }}
        </NButton>
      </template>
      <template #icon="{ row }">
        <div class="flex items-center justify-center">
          <IconifyIcon
            v-if="row.type === 'button'"
            icon="carbon:security"
            class="size-5"
          />
          <IconifyIcon
            v-else-if="row.meta?.icon"
            :icon="row.meta.icon"
            class="size-5"
          />
        </div>
      </template>
    </Grid>
  </Page>
</template>
