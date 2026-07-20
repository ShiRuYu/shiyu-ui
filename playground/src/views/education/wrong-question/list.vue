<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WrongQuestionApi } from '#/api';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Card, InputNumber, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWrongQuestion,
  listByStudentId as listWrongByStudent,
} from '#/api';
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
          const res = await listWrongByStudent(studentId.value);
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
  } as VxeTableGridOptions<WrongQuestionApi.WrongQuestion>,
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

function handleEdit(row: WrongQuestionApi.WrongQuestion) {
  formDrawerApi.setData(row);
  formDrawerApi.open();
}

function handleDelete(row: WrongQuestionApi.WrongQuestion) {
  Modal.confirm({
    content: $t('common.confirmDelete'),
    onOk: async () => {
      await deleteWrongQuestion(row.id);
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
          {{ $t('common.create', [$t('education.wrongQuestion.title')]) }}
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
