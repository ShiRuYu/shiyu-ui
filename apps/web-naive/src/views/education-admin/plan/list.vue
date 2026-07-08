<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { EducationPlanApi } from '#/api/education/plan';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePlan, getPlansByStudent } from '#/api/education/plan';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const { getCurrentStudentId } = useCurrentStudentId();

function onEdit(row: EducationPlanApi.StudyPlan) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onDelete(row: EducationPlanApi.StudyPlan) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deletePlan(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({
  code,
  row,
}: OnActionClickParams<EducationPlanApi.StudyPlan>) {
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
        query: async ({ page, pageSize }) => {
          const result = await getPlansByStudent(getCurrentStudentId());
          const items = Array.isArray(result) ? result : result?.items || [];
          return { items, total: items.length };
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
    <Grid :table-title="$t('education.plan.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('education.plan.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
