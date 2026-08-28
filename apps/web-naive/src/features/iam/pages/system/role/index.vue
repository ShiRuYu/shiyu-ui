<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/features/iam/api';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRole, getRoleList } from '#/features/iam/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import AuthCodeAssignment from './modules/auth-code-assignment.vue';
import Form from './modules/form.vue';
import MenuAssignment from './modules/menu-assignment.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [AuthCodeModal, authCodeModalApi] = useVbenModal({
  connectedComponent: AuthCodeAssignment,
  destroyOnClose: true,
});

const [MenuModal, menuModalApi] = useVbenModal({
  connectedComponent: MenuAssignment,
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
    case 'assignAuthCode': {
      authCodeModalApi.setData(row).open();
      break;
    }
    case 'assignMenu': {
      menuModalApi.setData(row).open();
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
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const query: Record<string, any> = Object.fromEntries(
            Object.entries(formValues || {}).filter(
              ([, v]) => v !== '' && v !== null && v !== undefined,
            ),
          );
          query.pageNum = page.currentPage;
          query.pageSize = page.pageSize;
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
    <AuthCodeModal />
    <MenuModal />
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:role:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
