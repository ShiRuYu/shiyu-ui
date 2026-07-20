<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { StudyPlanApi } from '#/api';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, InputNumber, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePlan, listByStudentId } from '#/api';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

const studentId = ref(1);

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
          // @ts-ignore vxe-table proxy page
          const res = await listByStudentId(studentId.value);
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
  } as VxeTableGridOptions<StudyPlanApi.StudyPlan>,
});

function handleStudentChange(val: null | number) {
  if (val) {
    studentId.value = val;
    gridApi.reload();
  }
}

function handleCreate() {
  formDrawerApi.open();
}

function handleEdit(row: StudyPlanApi.StudyPlan) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

function handleDelete(row: StudyPlanApi.StudyPlan) {
  Modal.confirm({
    content: $t('common.confirmDelete'),
    onOk: async () => {
      await deletePlan(row.id);
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
        <span>{{ $t('education.studyPlan.studentId') }}：</span>
        <InputNumber
          :min="1"
          :value="studentId"
          style="width: 120px"
          @change="handleStudentChange"
        />
        <Button v-access:add type="primary" @click="handleCreate">
          <Plus class="mr-1" />
          {{ $t('common.create', [$t('education.studyPlan.title')]) }}
        </Button>
      </div>
      <Grid />
    </Card>
    <FormDrawer @success="handleSuccess" />
  </Page>
</template>
