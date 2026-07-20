<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ResourceApi } from '#/api';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteResource, listAllResources, listByType } from '#/api';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

const typeFilter = ref<string | undefined>(undefined);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          const res = typeFilter.value
            ? await listByType(typeFilter.value)
            : await listAllResources();
          return { items: res, total: res.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<ResourceApi.Resource>,
});

function handleTypeChange(value: string | undefined) {
  typeFilter.value = value;
  gridApi.reload();
}

function handleCreate() {
  formDrawerApi.open();
}

function handleEdit(row: ResourceApi.Resource) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

function handleDelete(row: ResourceApi.Resource) {
  Modal.confirm({
    content: $t('common.confirmDelete'),
    onOk: async () => {
      await deleteResource(row.id);
      message.success($t('common.deleteSuccess'));
      gridApi.reload();
    },
  });
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page>
    <Card :bordered="false" class="card-wrapper">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <Select
          :allow-clear="true"
          :placeholder="$t('education.resource.type')"
          :style="{ width: '160px' }"
          :value="typeFilter"
          @change="handleTypeChange"
        >
          <Select.Option value="VIDEO">
{{
            $t('education.resource.video')
          }}
</Select.Option>
          <Select.Option value="DOCUMENT">
{{
            $t('education.resource.document')
          }}
</Select.Option>
          <Select.Option value="AUDIO">
{{
            $t('education.resource.audio')
          }}
</Select.Option>
          <Select.Option value="IMAGE">
{{
            $t('education.resource.image')
          }}
</Select.Option>
          <Select.Option value="OTHER">
{{
            $t('education.resource.other')
          }}
</Select.Option>
        </Select>
        <Button v-access:add type="primary" @click="handleCreate">
          <Plus class="mr-1" />
          {{ $t('common.create', [$t('education.resource.title')]) }}
        </Button>
      </div>
      <Grid>
        <template #action="{ row }">
          <a class="mr-2" @click="handleEdit(row)">{{ $t('common.edit') }}</a>
          <a class="mr-2" @click="handleDelete(row)">{{
            $t('common.delete')
          }}</a>
        </template>
      </Grid>
    </Card>
    <FormDrawer @success="handleSuccess" />
  </Page>
</template>
