<script lang="ts" setup>
import type { DataNode } from 'antdv-next/dist/tree';

import type { Recordable } from '@vben/types';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, nextTick, ref } from 'vue';

import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Spin, Tag } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { createRole, getRoleDetail, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<SystemRoleApi.SystemRole>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const permissions = ref<DataNode[]>([]);
const loadingPermissions = ref(false);

/** Tree 组件已勾选的菜单 ID 列表 */
const checkedKeys = ref<(number | string)[]>([]);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    // 将 Tree 的勾选状态同步到表单
    formApi.setFieldValue('permissions', checkedKeys.value);

    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    (id.value ? updateRole(id.value, values) : createRole(values))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemRoleApi.SystemRole>();
      formApi.resetForm();
      checkedKeys.value = [];

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }

      if (permissions.value.length === 0) {
        await loadPermissions();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data && data.id !== undefined && data.id !== null) {
        // 先设置基本字段（name, status, remark）
        formApi.setValues(data);
        // 再调用详情接口获取完整权限数据
        loadRolePermissions(data.id);
      }
    }
  },
});

/** 从后端加载角色详情（含完整 permissions） */
async function loadRolePermissions(roleId: number | string) {
  try {
    const detail = await getRoleDetail(String(roleId));
    if (detail?.permissions && detail.permissions.length > 0) {
      checkedKeys.value = detail.permissions;
    }
  } catch (e) {
    console.error('加载角色权限失败', e);
  }
}

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    const res = await getMenuList();
    permissions.value = res as unknown as DataNode[];
  } finally {
    loadingPermissions.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});

/** 获取树节点的自定义 CSS 类 */
function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === 'button') {
    classes.push('tree-node-button');
  }
  return classes.join(' ');
}

/**
 * 获取菜单类型对应的 Tag 颜色和标签文本
 */
function getTypeTag(type?: string) {
  switch (type) {
    case 'button':
      return { color: 'blue', text: '按钮' };
    case 'catalog':
      return { color: 'orange', text: '目录' };
    case 'menu':
      return { color: 'green', text: '页面' };
    default:
      return { color: 'default', text: type ?? '' };
  }
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form>
      <template #permissions>
        <Spin :spinning="loadingPermissions" :classes="{ root: 'w-full' }">
          <Tree
            v-model:model-value="checkedKeys"
            :tree-data="permissions"
            multiple
            bordered
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            value-field="id"
            label-field="meta.title"
            icon-field="meta.icon"
          >
            <template #node="{ value }">
              <div class="tree-node-content">
                <IconifyIcon
                  v-if="value.meta?.icon && value.type !== 'button'"
                  :icon="value.meta.icon"
                />
                <span class="tree-node-label">{{
                  $t(value.meta?.title ?? '')
                }}</span>
                <Tag
                  v-if="value.type && value.type !== 'catalog'"
                  :color="getTypeTag(value.type).color"
                  class="tree-node-tag"
                >
                  {{ getTypeTag(value.type).text }}
                </Tag>
              </div>
            </template>
          </Tree>
        </Spin>
      </template>
    </Form>
  </Drawer>
</template>
<style lang="css" scoped>
.tree-node-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.tree-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-tag {
  flex-shrink: 0;
  font-size: 10px;
  line-height: 14px;
  margin-inline-end: 0;
  transform: scale(0.85);
}

:deep(.tree-node-button) {
  .tree-node-content {
    padding-left: 4px;
  }

  .tree-node-label {
    font-size: 13px;
    color: var(--color-text-2, #666);
  }
}

:deep(.ant-tree-title) {
  .tree-actions {
    @apply ml-5 hidden;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    @apply ml-5 flex flex-auto justify-end;
  }
}
</style>
