<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NSelect, NSpin, NTree } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getMenuList } from '#/api/system/menu';
import { getRoleDetail, replaceRoleMenus } from '#/api/system/role';
import { getTenantList } from '#/api/system/tenant';
import { $t } from '#/locales';

const role = ref<SystemRoleApi.SystemRole>();
const menuTree = ref<any[]>([]);
const checkedMenuIds = ref<number[]>([]);
const checkedTreeKeys = ref<number[]>([]);
const loading = ref(false);
const scopedTenantId = ref<null | number>(null);
const tenantOptions = ref<Array<{ label: string; value: number }>>([]);

const title = computed(() => {
  return `${$t('system.role.assignMenu')} - ${role.value?.name ?? ''}`;
});

function renderLabel({ option }: { option: TreeOption }) {
  const icon = (option as any).meta?.icon;
  const title = (option as any).meta?.title || option.label || option.key;
  return icon
    ? h('span', { class: 'flex items-center gap-1' }, [
        h(IconifyIcon, { icon, class: 'size-4 shrink-0' }),
        h('span', String(title)),
      ])
    : h('span', String(title));
}

interface FlatMenu {
  id: number;
  parentId?: number;
  hasChildren: boolean;
}

function flattenMenus(menus: any[], parentId?: number): FlatMenu[] {
  return menus.flatMap((menu) => {
    const children = menu.children ?? [];
    return [
      {
        id: Number(menu.id),
        parentId,
        hasChildren: children.length > 0,
      },
      ...flattenMenus(children, Number(menu.id)),
    ];
  });
}

function getCheckedMenuIds(treeKeys: number[]) {
  const menuMap = new Map(
    flattenMenus(menuTree.value).map((menu) => [menu.id, menu]),
  );
  const checkedIds = new Set<number>();

  for (const id of treeKeys) {
    let current = menuMap.get(id);
    while (current) {
      checkedIds.add(current.id);
      current = current.parentId ? menuMap.get(current.parentId) : undefined;
    }
  }

  return [...checkedIds];
}

function getCheckedTreeKeys(menuIds: number[]) {
  const checked = new Set(menuIds);
  return flattenMenus(menuTree.value)
    .filter((menu) => !menu.hasChildren && checked.has(menu.id))
    .map((menu) => menu.id);
}

async function loadAssignedMenus() {
  if (!role.value?.id || scopedTenantId.value == null) {
    checkedMenuIds.value = [];
    checkedTreeKeys.value = [];
    return;
  }
  loading.value = true;
  try {
    const detail = await getRoleDetail(role.value.id, scopedTenantId.value);
    checkedMenuIds.value = (detail.permissions ?? []).map(Number);
    checkedTreeKeys.value = getCheckedTreeKeys(checkedMenuIds.value);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!role.value?.id || scopedTenantId.value == null) return;
    modalApi.lock();
    try {
      await replaceRoleMenus(
        role.value.id,
        scopedTenantId.value,
        checkedMenuIds.value,
      );
      message.success($t('ui.actionMessage.operationSuccess'));
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<SystemRoleApi.SystemRole>();
    role.value = data;
    loading.value = true;
    try {
      const [menus, tenantResult] = await Promise.all([
        menuTree.value.length === 0 ? getMenuList() : Promise.resolve(menuTree.value),
        getTenantList(),
      ]);
      if (menuTree.value.length === 0) {
        menuTree.value = Array.isArray(menus) ? menus : [];
      }
      tenantOptions.value = tenantResult.items.map((item) => ({
        label: item.name,
        value: item.id,
      }));
      scopedTenantId.value =
        data?.tenantId ?? tenantOptions.value[0]?.value ?? null;
      if (data?.id) {
        await loadAssignedMenus();
      } else {
        checkedMenuIds.value = [];
        checkedTreeKeys.value = [];
      }
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="title" class="w-[640px]">
    <NSpin :show="loading">
      <NSelect
        v-model:value="scopedTenantId"
        :options="tenantOptions"
        class="mb-3"
        @update:value="loadAssignedMenus"
        placeholder="选择授权生效租户"
      />
      <NTree
        :checked-keys="checkedTreeKeys"
        :data="menuTree"
        :default-expand-all="true"
        :render-label="renderLabel"
        block-line
        cascade
        checkable
        check-strategy="child"
        key-field="id"
        multiple
        style="max-height: 520px; overflow: auto; padding: 4px 0"
        @update:checked-keys="
          (keys) => {
            checkedTreeKeys = keys.map(Number);
            checkedMenuIds = getCheckedMenuIds(checkedTreeKeys);
          }
        "
      />
    </NSpin>
  </Modal>
</template>
