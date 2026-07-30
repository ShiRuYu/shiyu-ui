<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { AuthCodeApi } from '#/api/system/auth-code';
import type { SystemMenuApi } from '#/api/system/menu';
import type { SystemTenantApi } from '#/api/system/tenant';

import { computed, h, ref, shallowRef } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NInput,
  NSpin,
  NTabPane,
  NTabs,
  NTag,
  NTree,
} from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { getAuthCodeOptions } from '#/api/system/auth-code';
import { getMenuList } from '#/api/system/menu';
import { createTenant, updateTenant } from '#/api/system/tenant';
import { $t } from '#/locales';

import { useSchema } from '../data';

interface FlatMenu {
  hasChildren: boolean;
  id: number;
  parentId?: number;
}

interface ResourceGroup {
  children: AuthCodeApi.AuthCodeOption[];
  resource: string;
}

interface ModuleGroup {
  module: string;
  resources: ResourceGroup[];
}

const emit = defineEmits(['success']);
const formData = ref<SystemTenantApi.SystemTenant>();
const createDefaults = ref<
  Omit<Partial<SystemTenantApi.SystemTenant>, 'status'> & {
    adminRoleCode?: string;
    status?: number | string;
  }
>({});
const menuTree = shallowRef<SystemMenuApi.SystemMenu[]>([]);
const checkedMenuIds = ref<number[]>([]);
const checkedTreeKeys = ref<number[]>([]);
const authCodeOptions = shallowRef<AuthCodeApi.AuthCodeOption[]>([]);
const selectedAuthCodeIds = ref<number[]>([]);
const authCodeKeyword = ref('');
const initializationLoading = ref(false);

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.tenant.name')])
    : $t('ui.actionTitle.create', [$t('system.tenant.name')]);
});

const filteredAuthCodeOptions = computed(() => {
  const value = authCodeKeyword.value.trim().toLowerCase();
  if (!value) return authCodeOptions.value;
  return authCodeOptions.value.filter((item) =>
    [item.name, item.code, item.module, item.resource, item.action].some(
      (field) => field.toLowerCase().includes(value),
    ),
  );
});

const moduleGroups = computed<ModuleGroup[]>(() => {
  const modules = new Map<string, Map<string, AuthCodeApi.AuthCodeOption[]>>();
  filteredAuthCodeOptions.value.forEach((item) => {
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
      children,
      resource,
    })),
  }));
});

const selectedAuthCodeCount = computed(() => selectedAuthCodeIds.value.length);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

function flattenMenus(
  menus: SystemMenuApi.SystemMenu[],
  parentId?: number,
): FlatMenu[] {
  return menus.flatMap((menu) => {
    const children = menu.children ?? [];
    return [
      {
        hasChildren: children.length > 0,
        id: Number(menu.id),
        parentId,
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

function getAllLeafMenuIds() {
  return flattenMenus(menuTree.value)
    .filter((menu) => !menu.hasChildren)
    .map((menu) => menu.id);
}

function renderMenuLabel({ option }: { option: TreeOption }) {
  const icon = (option as SystemMenuApi.SystemMenu).meta?.icon;
  const title =
    (option as SystemMenuApi.SystemMenu).meta?.title ||
    option.label ||
    option.key;
  return icon
    ? h('span', { class: 'flex items-center gap-1' }, [
        h(IconifyIcon, { class: 'size-4 shrink-0', icon }),
        h('span', String(title)),
      ])
    : h('span', String(title));
}

function idsOfResource(resource: ResourceGroup) {
  return resource.children.map((item) => item.id);
}

function idsOfModule(module: ModuleGroup) {
  return module.resources.flatMap((resource) => idsOfResource(resource));
}

function isChecked(ids: number[]) {
  return (
    ids.length > 0 && ids.every((id) => selectedAuthCodeIds.value.includes(id))
  );
}

function isIndeterminate(ids: number[]) {
  const count = ids.filter((id) =>
    selectedAuthCodeIds.value.includes(id),
  ).length;
  return count > 0 && count < ids.length;
}

function toggleAuthCodeIds(ids: number[], checked: boolean) {
  const idSet = new Set(ids);
  const nextIds = selectedAuthCodeIds.value.filter((id) => !idSet.has(id));
  if (checked) nextIds.push(...ids);
  selectedAuthCodeIds.value = [...new Set(nextIds)];
}

function selectedIn(ids: number[]) {
  return ids.filter((id) => selectedAuthCodeIds.value.includes(id)).length;
}

function resetInitializationSelections() {
  checkedTreeKeys.value = getAllLeafMenuIds();
  checkedMenuIds.value = getCheckedMenuIds(checkedTreeKeys.value);
  selectedAuthCodeIds.value = authCodeOptions.value.map((item) => item.id);
  authCodeKeyword.value = '';
}

function resetForm() {
  formApi.resetForm();
  formApi.setValues(formData.value || createDefaults.value);
  if (!formData.value?.id) resetInitializationSelections();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value?.id && checkedMenuIds.value.length === 0) {
      message.warning($t('system.tenant.selectAtLeastOneMenu'));
      return;
    }
    if (!formData.value?.id && selectedAuthCodeIds.value.length === 0) {
      message.warning($t('system.tenant.selectAtLeastOneAuthCode'));
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.lock();
    const data = (await formApi.getValues()) as SystemTenantApi.SystemTenant & {
      adminRoleCode?: string;
    };
    try {
      const submitData = {
        ...data,
        ...(formData.value?.id
          ? {}
          : {
              authCodeIds: selectedAuthCodeIds.value,
              menuIds: checkedMenuIds.value,
            }),
      };
      delete submitData.adminRoleCode;
      if (submitData.status !== undefined) {
        submitData.status = String(submitData.status);
      }
      await (formData.value?.id
        ? updateTenant(formData.value.id, submitData)
        : createTenant(submitData));
      message.success(
        formData.value?.id
          ? $t('ui.actionMessage.editSuccess', [$t('system.tenant.name')])
          : $t('ui.actionMessage.createSuccess', [$t('system.tenant.name')]),
      );
      modalApi.close();
      emit('success');
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<SystemTenantApi.SystemTenant>();
    formApi.resetForm();
    if (data?.id) {
      formData.value = data;
      createDefaults.value = {};
      formApi.setValues(data);
      return;
    }

    formData.value = undefined;
    initializationLoading.value = true;
    try {
      const [menus, authCodes] = await Promise.all([
        getMenuList(),
        getAuthCodeOptions(),
      ]);
      menuTree.value = Array.isArray(menus) ? menus : [];
      authCodeOptions.value = Array.isArray(authCodes) ? authCodes : [];
      createDefaults.value = {
        adminRoleCode: 'tenant_super',
        adminRoleName: $t('system.tenant.defaultAdminRoleName'),
        status: '1',
      };
      formApi.setValues(createDefaults.value);
      resetInitializationSelections();
    } finally {
      initializationLoading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[920px]">
    <NTabs v-if="!formData?.id" animated type="line">
      <NTabPane name="base" :tab="$t('system.tenant.baseInfo')">
        <Form class="mx-4" />
      </NTabPane>

      <NTabPane name="menus" :tab="$t('system.tenant.initialMenus')">
        <NSpin :show="initializationLoading">
          <div class="mb-2 flex justify-end">
            <NTag type="info">
              {{
                $t('system.tenant.menuSelected', [
                  checkedMenuIds.length,
                  flattenMenus(menuTree).length,
                ])
              }}
            </NTag>
          </div>
          <NTree
            :checked-keys="checkedTreeKeys"
            :data="menuTree"
            :default-expand-all="true"
            :render-label="renderMenuLabel"
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
      </NTabPane>

      <NTabPane name="auth-codes" :tab="$t('system.tenant.initialAuthCodes')">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <NInput
              v-model:value="authCodeKeyword"
              clearable
              :placeholder="$t('system.role.authCodeSearchPlaceholder')"
            />
            <NTag type="info" class="shrink-0">
              {{
                $t('system.role.authCodeSelected', [
                  selectedAuthCodeCount,
                  authCodeOptions.length,
                ])
              }}
            </NTag>
          </div>

          <NSpin :show="initializationLoading">
            <NCollapse
              v-if="moduleGroups.length > 0"
              :default-expanded-names="
                moduleGroups.map((group) => group.module)
              "
              style="max-height: 520px; overflow: auto"
            >
              <NCollapseItem
                v-for="module in moduleGroups"
                :key="module.module"
                :name="module.module"
              >
                <template #header>
                  <div class="flex items-center gap-2">
                    <NCheckbox
                      :checked="isChecked(idsOfModule(module))"
                      :indeterminate="isIndeterminate(idsOfModule(module))"
                      @click.stop
                      @update:checked="
                        (checked) =>
                          toggleAuthCodeIds(idsOfModule(module), checked)
                      "
                    />
                    <span>{{ module.module }}</span>
                    <NTag size="small">
                      {{ selectedIn(idsOfModule(module)) }} /
                      {{ idsOfModule(module).length }}
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
                          :checked="isChecked(idsOfResource(resource))"
                          :indeterminate="
                            isIndeterminate(idsOfResource(resource))
                          "
                          @click.stop
                          @update:checked="
                            (checked) =>
                              toggleAuthCodeIds(
                                idsOfResource(resource),
                                checked,
                              )
                          "
                        />
                        <span>{{ resource.resource }}</span>
                        <NTag size="small">
                          {{ selectedIn(idsOfResource(resource)) }} /
                          {{ resource.children.length }}
                        </NTag>
                      </div>
                    </template>

                    <div class="grid grid-cols-1 gap-2 pl-10 md:grid-cols-2">
                      <NCheckbox
                        v-for="item in resource.children"
                        :key="item.id"
                        :checked="selectedAuthCodeIds.includes(item.id)"
                        @update:checked="
                          (checked) => toggleAuthCodeIds([item.id], checked)
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
              v-if="!initializationLoading && moduleGroups.length === 0"
              :description="$t('common.noData')"
              class="py-12"
            />
          </NSpin>
        </div>
      </NTabPane>
    </NTabs>

    <Form v-else class="mx-4" />

    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="resetForm">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>
