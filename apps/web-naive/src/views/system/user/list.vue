<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { dialog, message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUser, getUserList, resetUserPassword } from '#/api/system/user';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/**
 * 编辑用户
 * @param row
 */
function onEdit(row: SystemUserApi.SystemUser) {
  formModalApi.setData(row).open();
}

/**
 * 创建新用户
 */
function onCreate() {
  formModalApi.setData(null).open();
}

/**
 * 删除用户
 * @param row
 */
function onDelete(row: SystemUserApi.SystemUser) {
  dialog.warning({
    title: '提示',
    content: `确定要删除用户"${row.username}"吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      const hideLoading = message.loading('正在删除...', {
        duration: 0,
      });
      deleteUser(row.id)
        .then(() => {
          message.success($t('ui.actionMessage.deleteSuccess', [row.username]));
          refreshGrid();
          hideLoading();
        })
        .catch(() => {
          hideLoading();
        });
    },
  });
}

/**
 * 重置密码
 * @param row
 */
function onResetPassword(row: SystemUserApi.SystemUser) {
  dialog.warning({
    title: '重置密码',
    content: `确定要重置用户"${row.username}"的密码吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      const hideLoading = message.loading('正在重置密码...', {
        duration: 0,
      });
      try {
        // 这里可以调用后端接口生成随机密码或设置默认密码
        await resetUserPassword(row.id, '123456');
        message.success('密码已重置为：123456');
        hideLoading();
      } catch (error) {
        hideLoading();
        console.error(error);
      }
    },
  });
}

/**
 * 表格操作按钮的回调函数
 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'resetPassword': {
      onResetPassword(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
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
          return await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
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
    <Grid table-title="用户列表">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.user.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
