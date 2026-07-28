<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { AuthCodeApi } from '#/api/system/auth-code';

import { computed, h, shallowRef } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NEmpty,
  NInput,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { deleteAuthCode, getAuthCodeList } from '#/api/system/auth-code';
import { $t } from '#/locales';

import Form from './modules/form.vue';

interface ResourceGroup {
  resource: string;
  children: AuthCodeApi.AuthCodeItem[];
}

interface ModuleGroup {
  module: string;
  resources: ResourceGroup[];
}

const codes = shallowRef<AuthCodeApi.AuthCodeItem[]>([]);
const keyword = shallowRef('');
const loading = shallowRef(false);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: AuthCodeApi.AuthCodeItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function refreshGrid() {
  loading.value = true;
  getAuthCodeList()
    .then((data) => {
      codes.value = Array.isArray(data) ? data : [];
    })
    .finally(() => {
      loading.value = false;
    });
}

function onDelete(row: AuthCodeApi.AuthCodeItem) {
  const hideLoading = message.loading($t('common.deleting'), {
    duration: 0,
  });
  deleteAuthCode(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
    })
    .finally(() => hideLoading.destroy());
}

const filteredCodes = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) return codes.value;
  return codes.value.filter((item) =>
    [item.name, item.code, item.module, item.resource, item.action].some(
      (field) => field.toLowerCase().includes(value),
    ),
  );
});

const groups = computed<ModuleGroup[]>(() => {
  const modules = new Map<string, Map<string, AuthCodeApi.AuthCodeItem[]>>();
  filteredCodes.value.forEach((item) => {
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

function columns(): DataTableColumns<AuthCodeApi.AuthCodeItem> {
  return [
    { key: 'id', title: 'ID', width: 70 },
    { key: 'name', title: $t('system.authCode.name'), minWidth: 160 },
    { key: 'action', title: $t('system.authCode.action'), width: 110 },
    { key: 'code', title: $t('system.authCode.code'), minWidth: 220 },
    {
      key: 'operation',
      title: $t('system.authCode.operation'),
      width: 140,
      render: (row) =>
        h('div', { class: 'flex gap-2' }, [
          h(
            NButton,
            { text: true, type: 'primary', onClick: () => onEdit(row) },
            { default: () => $t('common.edit') },
          ),
          h(
            NButton,
            { text: true, type: 'error', onClick: () => onDelete(row) },
            { default: () => $t('common.delete') },
          ),
        ]),
    },
  ];
}

refreshGrid();
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <div class="flex h-full flex-col gap-4">
      <div class="flex items-center gap-3">
        <NInput
          v-model:value="keyword"
          clearable
          class="max-w-md"
          :placeholder="$t('system.authCode.searchPlaceholder')"
        />
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:auth-code:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.authCode.title')]) }}
        </NButton>
      </div>

      <NSpin :show="loading">
        <NCollapse
          v-if="groups.length > 0"
          :default-expanded-names="groups.map((group) => group.module)"
        >
          <NCollapseItem
            v-for="module in groups"
            :key="module.module"
            :name="module.module"
          >
            <template #header>
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ module.module }}</span>
                <NTag size="small">
                  {{
                    module.resources.reduce(
                      (total, resource) => total + resource.children.length,
                      0,
                    )
                  }}
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
                    <span>{{ resource.resource }}</span>
                    <NTag size="small" type="info">
                      {{ resource.children.length }}
                    </NTag>
                  </div>
                </template>
                <NDataTable
                  :columns="columns()"
                  :data="resource.children"
                  :row-key="(row) => row.id"
                  size="small"
                  striped
                />
              </NCollapseItem>
            </NCollapse>
          </NCollapseItem>
        </NCollapse>
        <NEmpty
          v-else-if="!loading"
          :description="$t('common.noData')"
          class="py-12"
        />
      </NSpin>
    </div>
  </Page>
</template>
