<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { EducationReviewApi } from '#/features/education/api';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton, NSelect, NSpace } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  completeReview,
  deleteReview,
  getReviewsByStatus,
  getStudentOptions,
} from '#/features/education/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const selectedStudentId = ref<null | number>(null);
const studentOptions = ref<Array<{ label: string; value: number }>>([]);
onMounted(async () => {
  studentOptions.value = (await getStudentOptions()).map((student) => ({
    label: student.name,
    value: student.id,
  }));
});

function onEdit(row: EducationReviewApi.ReviewTask) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onComplete(row: EducationReviewApi.ReviewTask) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  completeReview(row.id, { studentId: row.studentId, resultScore: 100 })
    .then(() => {
      message.success($t('ui.actionMessage.operationSuccess'));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onDelete(row: EducationReviewApi.ReviewTask) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deleteReview(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess'));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({
  code,
  row,
}: OnActionClickParams<EducationReviewApi.ReviewTask>) {
  switch (code) {
    case 'complete': {
      onComplete(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema(), submitOnChange: true },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!selectedStudentId.value) return { items: [], total: 0 };
          const result = await getReviewsByStatus(selectedStudentId.value, 0);
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
    <Grid :table-title="$t('education.review.title')">
      <template #toolbar-tools>
        <NSpace align="center">
          <NSelect
            v-model:value="selectedStudentId"
            :options="studentOptions"
            :placeholder="$t('education.review.selectStudent')"
            clearable
            class="w-[200px]"
            @update:value="refreshGrid"
          />
          <NButton
            type="primary"
            @click="onCreate"
            v-access:code="['edu:review:create']"
          >
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('education.review.title')]) }}
          </NButton>
        </NSpace>
      </template>
    </Grid>
  </Page>
</template>
