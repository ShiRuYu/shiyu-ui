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
  roleId: null | number;
}

const emit = defineEmits<{ success: [] }>();
const user = ref<SystemUserApi.SystemUser>();
const tenants = ref<SystemTenantApi.SystemTenant[]>([]);
const roles = ref<SystemRoleApi.SystemRole[]>([]);
const rows = ref<AssignmentRow[]>([]);
const loading = ref(false);

const tenantOptions = computed(() =>
  tenants.value.map((item) => ({ label: item.name, value: item.id })),
);
const roleOptions = computed(() =>
  roles.value.map((item) => ({ label: item.name, value: item.id })),
);

function addRow() {
  rows.value.push({ tenantId: null, roleId: null });
}

function removeRow(index: number) {
  rows.value.splice(index, 1);
}

function isTenantUsed(tenantId: null | number, index: number) {
  return rows.value.some(
    (item, rowIndex) =>
      rowIndex !== index && item.tenantId != null && item.tenantId === tenantId,
  );
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!user.value?.id) return;
    const assignments = rows.value.filter(
      (item): item is { roleId: number; tenantId: number; } =>
        item.tenantId != null && item.roleId != null,
    );
    if (assignments.length !== rows.value.length) {
      message.warning($t('system.user.tenantAssignmentIncomplete'));
      return;
    }
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
      const [tenantResult, roleResult, assignmentResult] = await Promise.all([
        getTenantList(),
        getAllRoles('1'),
        getUserTenantAssignments(user.value.id),
      ]);
      tenants.value = tenantResult.items;
      roles.value = Array.isArray(roleResult) ? roleResult : [];
      rows.value = (assignmentResult ?? []).map((item) => ({
        tenantId: item.tenantId,
        roleId: item.roleId,
      }));
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal
    :title="`${$t('system.user.assignTenant')} - ${user?.nickName || user?.username || ''}`"
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
                if (isTenantUsed(value, index)) row.tenantId = null;
              }
            "
          />
          <NSelect
            v-model:value="row.roleId"
            :options="roleOptions"
            :placeholder="$t('system.user.selectRole')"
            class="flex-1"
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
