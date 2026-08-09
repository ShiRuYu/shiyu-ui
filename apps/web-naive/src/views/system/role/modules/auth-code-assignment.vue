<script lang="ts" setup>
import type { AuthCodeApi } from '#/api/system/auth-code';
import type { SystemRoleApi } from '#/api/system/role';

import { computed, shallowRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NInput,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  getAuthCodeOptions,
  getRoleAuthCodes,
  replaceRoleAuthCodes,
} from '#/api/system/auth-code';
import { $t } from '#/locales';

interface ResourceGroup {
  resource: string;
  children: AuthCodeApi.AuthCodeOption[];
}

interface ModuleGroup {
  module: string;
  resources: ResourceGroup[];
}

const role = shallowRef<SystemRoleApi.SystemRole>();
const userStore = useUserStore();
const options = shallowRef<AuthCodeApi.AuthCodeOption[]>([]);
const selectedCodes = shallowRef<string[]>([]);
const keyword = shallowRef('');
const loading = shallowRef(false);
const tenantId = shallowRef<null | number>(null);

const title = computed(() => {
  return `${$t('system.role.assignAuthCode')} - ${role.value?.name ?? ''}`;
});

const filteredOptions = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) return options.value;
  return options.value.filter((item) =>
    [item.name, item.code, item.module, item.resource, item.action].some(
      (field) => field.toLowerCase().includes(value),
    ),
  );
});

const moduleGroups = computed<ModuleGroup[]>(() => {
  const modules = new Map<string, Map<string, AuthCodeApi.AuthCodeOption[]>>();
  filteredOptions.value.forEach((item) => {
    const resources = modules.get(item.module) ?? new Map();
    const resource = item.resource || '-';
    const items = resources.get(resource) ?? [];
    items.push(item);
    resources.set(resource, items);
    modules.set(item.module, resources);
  });

  return [...modules.entries()].map(([module, resources]) => ({
    module,
    resources: [...resources.entries()].map(([resource, children]) => ({
      resource,
      children,
    })),
  }));
});

const selectedCount = computed(() => selectedCodes.value.length);
const totalCount = computed(() => options.value.length);

function codesOfResource(resource: ResourceGroup) {
  return resource.children.map((item) => item.code);
}

function codesOfModule(module: ModuleGroup) {
  return module.resources.flatMap((resource) => codesOfResource(resource));
}

function isChecked(codes: string[]) {
  return (
    codes.length > 0 &&
    codes.every((code) => selectedCodes.value.includes(code))
  );
}

function isIndeterminate(codes: string[]) {
  const count = codes.filter((code) =>
    selectedCodes.value.includes(code),
  ).length;
  return count > 0 && count < codes.length;
}

function toggleCodes(codes: string[], checked: boolean) {
  const codeSet = new Set(codes);
  const nextCodes = selectedCodes.value.filter((code) => !codeSet.has(code));
  if (checked) nextCodes.push(...codes);
  selectedCodes.value = [...new Set(nextCodes)];
}

function selectedIn(codes: string[]) {
  return codes.filter((code) => selectedCodes.value.includes(code)).length;
}

const [Modal, modalApi] = useVbenModal<SystemRoleApi.SystemRole>({
  async onConfirm() {
    if (!role.value?.id || tenantId.value === null) return;
    modalApi.lock();
    try {
      await replaceRoleAuthCodes(
        role.value.id,
        tenantId.value,
        selectedCodes.value,
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
    keyword.value = '';
    loading.value = true;
    try {
      tenantId.value = userStore.currentTenantId;
      const [allOptions, assignedCodes] = await Promise.all([
        getAuthCodeOptions(),
        data?.id && tenantId.value !== null
          ? getRoleAuthCodes(data.id, tenantId.value)
          : Promise.resolve([]),
      ]);
      options.value = Array.isArray(allOptions) ? allOptions : [];
      selectedCodes.value = Array.isArray(assignedCodes) ? assignedCodes : [];
    } finally {
      loading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="title" class="w-[720px]">
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <NInput
          v-model:value="keyword"
          clearable
          :placeholder="$t('system.role.authCodeSearchPlaceholder')"
        />
        <NTag type="info" class="shrink-0">
          {{ $t('system.role.authCodeSelected', [selectedCount, totalCount]) }}
        </NTag>
      </div>

      <NSpin :show="loading">
        <NCollapse
          v-if="moduleGroups.length > 0"
          :default-expanded-names="moduleGroups.map((group) => group.module)"
        >
          <NCollapseItem
            v-for="module in moduleGroups"
            :key="module.module"
            :name="module.module"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <NCheckbox
                  :checked="isChecked(codesOfModule(module))"
                  :indeterminate="isIndeterminate(codesOfModule(module))"
                  @click.stop
                  @update:checked="
                    (checked) => toggleCodes(codesOfModule(module), checked)
                  "
                />
                <span>{{ module.module }}</span>
                <NTag size="small">
                  {{ selectedIn(codesOfModule(module)) }} /
                  {{ codesOfModule(module).length }}
                </NTag>
              </div>
            </template>

            <NCollapse
              :default-expanded-names="
                module.resources.map((resource) => resource.resource)
              "
            >
              <NCollapseItem
                v-for="resource in module.resources"
                :key="resource.resource"
                :name="resource.resource"
              >
                <template #header>
                  <div class="flex items-center gap-2 pl-4">
                    <NCheckbox
                      :checked="isChecked(codesOfResource(resource))"
                      :indeterminate="
                        isIndeterminate(codesOfResource(resource))
                      "
                      @click.stop
                      @update:checked="
                        (checked) =>
                          toggleCodes(codesOfResource(resource), checked)
                      "
                    />
                    <span>{{ resource.resource }}</span>
                    <NTag size="small">
                      {{ selectedIn(codesOfResource(resource)) }} /
                      {{ resource.children.length }}
                    </NTag>
                  </div>
                </template>

                <div class="grid grid-cols-1 gap-2 pl-10 md:grid-cols-2">
                  <NCheckbox
                    v-for="item in resource.children"
                    :key="item.code"
                    :checked="selectedCodes.includes(item.code)"
                    @update:checked="
                      (checked) => toggleCodes([item.code], checked)
                    "
                  >
                    <div class="flex flex-col">
                      <span>{{ item.name }}</span>
                      <span class="text-xs text-gray-400">
                        {{ item.action }} · {{ item.code }}
                      </span>
                    </div>
                  </NCheckbox>
                </div>
              </NCollapseItem>
            </NCollapse>
          </NCollapseItem>
        </NCollapse>
        <NEmpty
          v-if="!loading && moduleGroups.length === 0"
          :description="$t('common.noData')"
          class="py-12"
        />
      </NSpin>
    </div>
  </Modal>
</template>
