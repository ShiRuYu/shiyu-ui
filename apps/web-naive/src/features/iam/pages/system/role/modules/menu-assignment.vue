<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { SystemRoleApi } from '#/features/iam/api';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import { NSpin, NTree } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getMenuList } from '#/features/iam/api';
import { getRoleDetail, replaceRoleMenus } from '#/features/iam/api';
import { $t } from '#/locales';

const userStore = useUserStore();
const role = ref<SystemRoleApi.SystemRole>();
const menuTree = ref<any[]>([]);
const checkedMenuIds = ref<number[]>([]);
const checkedTreeKeys = ref<number[]>([]);
const loading = ref(false);
const tenantId = ref<null | number>(null);

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
  if (!role.value?.id || tenantId.value === null) {
    checkedMenuIds.value = [];
    checkedTreeKeys.value = [];
    return;
  }
  loading.value = true;
  try {
    const detail = await getRoleDetail(role.value.id, tenantId.value);
    checkedMenuIds.value = (detail.permissions ?? []).map(Number);
    checkedTreeKeys.value = getCheckedTreeKeys(checkedMenuIds.value);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal<SystemRoleApi.SystemRole>({
  async onConfirm() {
    if (!role.value?.id || tenantId.value === null) return;
    modalApi.lock();
    try {
      await replaceRoleMenus(
        role.value.id,
        tenantId.value,
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
    const data = modalApi.getData();
    role.value = data;
    loading.value = true;
    try {
      const menus =
        menuTree.value.length === 0 ? await getMenuList() : menuTree.value;
      if (menuTree.value.length === 0) {
        menuTree.value = Array.isArray(menus) ? menus : [];
      }
      tenantId.value = userStore.currentTenantId;
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
  <Modal :title="title" class="w-[92vw] max-w-[640px]">
    <NSpin :show="loading">
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
        style="max-height: 520px; padding: 4px 0; overflow: auto"
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
