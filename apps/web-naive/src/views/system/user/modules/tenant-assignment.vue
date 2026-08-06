<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemTenantApi } from '#/api/system/tenant';
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NEmpty, NSelect, NSpace, NSpin } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getAllRoles } from '#/api/system/role';
import { getTenantList } from '#/api/system/tenant';
import {
  getUserTenantAssignments,
  replaceUserTenantAssignments,
} from '#/api/system/user';
import { $t } from '#/locales';

interface AssignmentRow {
  tenantId: null | number;
  roleIds: number[];
}

const emit = defineEmits<{ success: [] }>();
const user = ref<SystemUserApi.SystemUser>();
const tenants = ref<SystemTenantApi.SystemTenant[]>([]);
const rolesByTenant = ref<Record<number, SystemRoleApi.SystemRole[]>>({});
const roleLoadingByTenant = ref<Record<number, boolean>>({});
const rows = ref<AssignmentRow[]>([]);
const loading = ref(false);

function flattenTenants(items: SystemTenantApi.SystemTenant[]) {
  return items.flatMap((item) => [
    item,
    ...flattenTenants(item.children ?? []),
  ]);
}

const tenantOptions = computed(() =>
  flattenTenants(tenants.value).map((item) => ({
    label: item.name,
    value: item.id,
  })),
);
const roleOptions = (tenantId: null | number) =>
  tenantId === null
    ? []
    : (rolesByTenant.value[tenantId] ?? []).map((item) => ({
        label: item.name,
        value: item.id,
      }));

const roleLoading = (tenantId: null | number) =>
  tenantId !== null && roleLoadingByTenant.value[tenantId] === true;

async function loadRoles(tenantId: null | number) {
  if (tenantId === null || rolesByTenant.value[tenantId]) return;
  roleLoadingByTenant.value[tenantId] = true;
  try {
    const result = await getAllRoles('1', tenantId);
    rolesByTenant.value[tenantId] = Array.isArray(result) ? result : [];
  } finally {
    roleLoadingByTenant.value[tenantId] = false;
  }
}

function addRow() {
  rows.value.push({ tenantId: null, roleIds: [] });
}

function removeRow(index: number) {
  rows.value.splice(index, 1);
}

function isTenantUsed(tenantId: null | number, index: number) {
  return rows.value.some(
    (item, rowIndex) =>
      rowIndex !== index &&
      item.tenantId !== null &&
      item.tenantId === tenantId,
  );
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!user.value?.id) return;
    if (
      rows.value.some(
        (item) => item.tenantId === null || item.roleIds.length === 0,
      )
    ) {
      message.warning($t('system.user.tenantAssignmentIncomplete'));
      return;
    }
    const assignments = rows.value.flatMap((item) =>
      item.roleIds.map((roleId) => ({
        roleId,
        tenantId: item.tenantId as number,
      })),
    );
    modalApi.lock();
    try {
      await replaceUserTenantAssignments(user.value.id, assignments);
      message.success($t('ui.actionMessage.operationSuccess'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    user.value = modalApi.getData<SystemUserApi.SystemUser>();
    if (!user.value?.id) return;
    loading.value = true;
    try {
      const [tenantResult, assignmentResult] = await Promise.all([
        getTenantList(),
        getUserTenantAssignments(user.value.id),
      ]);
      tenants.value = tenantResult.items;
      rolesByTenant.value = {};
      const grouped = new Map<number, number[]>();
      for (const item of assignmentResult ?? []) {
        const roleIds = grouped.get(item.tenantId) ?? [];
        if (!roleIds.includes(item.roleId)) roleIds.push(item.roleId);
        grouped.set(item.tenantId, roleIds);
      }
      rows.value = [...grouped.entries()].map(([tenantId, roleIds]) => ({
        tenantId,
        roleIds,
      }));
      await Promise.all(
        [...grouped.keys()].map((tenantId) => loadRoles(tenantId)),
      );
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal
    :title="`${$t('system.user.assignTenant')} - ${user?.nickName || user?.username || ''}`"
    :cancel-text="$t('common.cancel')"
    :confirm-text="$t('common.confirm')"
    :show-cancel-button="true"
    :show-confirm-button="true"
    :show-footer="true"
    class="w-[680px]"
  >
    <NSpin :show="loading">
      <div class="space-y-3">
        <div
          v-for="(row, index) in rows"
          :key="index"
          class="flex items-center gap-2"
        >
          <NSelect
            v-model:value="row.tenantId"
            :options="tenantOptions"
            :placeholder="$t('system.user.selectTenant')"
            class="flex-1"
            @update:value="
              (value) => {
                if (isTenantUsed(value, index)) {
                  row.tenantId = null;
                  row.roleIds = [];
                  return;
                }
                row.roleIds = [];
                loadRoles(value);
              }
            "
          />
          <NSelect
            v-model:value="row.roleIds"
            :options="roleOptions(row.tenantId)"
            :placeholder="$t('system.user.selectRole')"
            class="flex-1"
            :loading="roleLoading(row.tenantId)"
            multiple
          />
          <NButton quaternary type="error" @click="removeRow(index)">
            {{ $t('system.user.removeTenant') }}
          </NButton>
        </div>
        <NEmpty
          v-if="rows.length === 0"
          :description="$t('system.user.noTenantAssigned')"
        />
        <NSpace>
          <NButton type="primary" secondary @click="addRow">
            {{ $t('system.user.addTenant') }}
          </NButton>
        </NSpace>
      </div>
    </NSpin>
  </Modal>
</template>
