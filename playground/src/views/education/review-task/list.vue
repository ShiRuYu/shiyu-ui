<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ReviewTaskApi } from '#/api';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { Card, InputNumber, message, Radio } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { completeReview, listByStatus, listTodayTasks } from '#/api';
import { $t } from '#/locales';

import { useColumns } from './data';
import CompleteForm from './modules/form.vue';

const studentId = ref(1);
const filterMode = ref<'today' | 'all'>('today');

const [CompleteDrawer, completeDrawerApi] = useVbenDrawer({
  connectedComponent: CompleteForm,
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
          const res =
            filterMode.value === 'today'
              ? await listTodayTasks(studentId.value)
              : await listByStatus(studentId.value, 'PENDING');
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
  } as VxeTableGridOptions<ReviewTaskApi.ReviewTask>,
});

function handleStudentChange(val: number | null) {
  if (val) {
    studentId.value = val;
    gridApi.reload();
  }
}

function handleModeChange(val: any) {
  filterMode.value = val.target.value;
  gridApi.reload();
}

async function handleComplete(row: ReviewTaskApi.ReviewTask) {
  completeDrawerApi.setData(row);
  completeDrawerApi.open();
}

function handleSuccess() {
  gridApi.reload();
}
</script>

<template>
  <Page>
    <Card :bordered="false" class="card-wrapper">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span>{{ $t('education.reviewTask.knowledgeId') }}：</span>
        <InputNumber
          :min="1"
          :value="studentId"
          style="width: 120px"
          @change="handleStudentChange"
        />
        <Radio.Group :value="filterMode" @change="handleModeChange">
          <Radio.Button value="today">
            {{ $t('education.reviewTask.today') }}
          </Radio.Button>
          <Radio.Button value="all">
            {{ $t('education.reviewTask.pending') }}
          </Radio.Button>
        </Radio.Group>
      </div>
      <Grid>
        <template #action="{ row }">
          <a
            v-if="row.status !== 'COMPLETED'"
            class="mr-2"
            @click="handleComplete(row)"
          >
            {{ $t('common.complete') }}
          </a>
        </template>
      </Grid>
    </Card>
    <CompleteDrawer @success="handleSuccess" />
  </Page>
</template>
