<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NSpin, NTree } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getMenuList } from '#/api/system/menu';
import { getRoleDetail, replaceRoleMenus } from '#/api/system/role';
import { $t } from '#/locales';

const role = ref<SystemRoleApi.SystemRole>();
const menuTree = ref<any[]>([]);
const checkedMenuIds = ref<number[]>([]);
const loading = ref(false);

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

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!role.value?.id) return;
    modalApi.lock();
    try {
      await replaceRoleMenus(role.value.id, checkedMenuIds.value);
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
      if (menuTree.value.length === 0) {
        const menus = await getMenuList();
        menuTree.value = Array.isArray(menus) ? menus : [];
      }
      if (data?.id) {
        const detail = await getRoleDetail(data.id);
        checkedMenuIds.value = (detail.permissions ?? []).map(Number);
      } else {
        checkedMenuIds.value = [];
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
      <NTree
        :checked-keys="checkedMenuIds"
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
            checkedMenuIds = keys.map(Number);
          }
        "
      />
    </NSpin>
  </Modal>
</template>
