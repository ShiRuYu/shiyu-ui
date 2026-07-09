<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRole, getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/**
 * 编辑角色
 * @param row
 */
function onEdit(row: SystemRoleApi.SystemRole) {
  formModalApi.setData(row).open();
}

/**
 * 创建新角色
 */
function onCreate() {
  formModalApi.setData({}).open();
}

/**
 * 删除角色
 * @param row
 */
function onDelete(row: SystemRoleApi.SystemRole) {
  const hideLoading = message.loading($t('common.deleting'), {
    duration: 0,
  });
  deleteRole(row.id)
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
}: OnActionClickParams<SystemRoleApi.SystemRole>) {
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
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (params: any, formValues) => {
          const query: Record<string, any> = Object.fromEntries(
            Object.entries(formValues || {}).filter(
              ([, v]) => v !== '' && v !== null && v !== undefined,
            ),
          );
          if ((params as any)?.page) query.pageNo = (params as any).page;
          if ((params as any)?.pageSize)
            query.pageSize = (params as any).pageSize;
          const data = await getRoleList(query);
          if (data && typeof data === 'object' && 'items' in data) {
            return { items: data.items, total: data.total };
          }
          const list = Array.isArray(data) ? data : [];
          return { items: list, total: list.length };
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
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate" v-access:code="['system:role:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
