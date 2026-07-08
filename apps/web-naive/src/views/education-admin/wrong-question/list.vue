<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { EducationWrongQuestionApi } from '#/api/education/wrong-question';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWrongQuestion,
  getWrongQuestionsByStudent,
} from '#/api/education/wrong-question';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const { getCurrentStudentId } = useCurrentStudentId();

function onEdit(row: EducationWrongQuestionApi.WrongQuestion) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onDelete(row: EducationWrongQuestionApi.WrongQuestion) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deleteWrongQuestion(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({
  code,
  row,
}: OnActionClickParams<EducationWrongQuestionApi.WrongQuestion>) {
  switch (code) {
    case 'delete':
      onDelete(row);
      break;
    case 'edit':
      onEdit(row);
      break;
  }
}
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async () => {
          const result = await getWrongQuestionsByStudent(
            getCurrentStudentId(),
          );
          return { items: result, total: result.length };
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});
function refreshGrid() {
  gridApi.query();
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('education.wrongQuestion.title')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{
            $t('ui.actionTitle.create', [$t('education.wrongQuestion.name')])
          }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
