<script lang="ts" setup>
import type { OnActionClickParams } from '#/adapter/vxe-table';
import type { TimelineApi } from '#/api/record/timeline';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTimeline, getTimelinePage } from '#/api/record/timeline';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: TimelineApi.TimelineEvent) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData({}).open();
}

function onDelete(row: TimelineApi.TimelineEvent) {
  const hideLoading = message.loading('正在删除...', { duration: 0 });
  deleteTimeline(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
      refreshGrid();
      hideLoading.destroy();
    })
    .catch(() => {
      hideLoading.destroy();
    });
}

function onActionClick({ code, row }: OnActionClickParams<TimelineApi.TimelineEvent>) {
  switch (code) {
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
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async (params, formValues) => {
          if (!formValues?.profileId) {
            return { items: [], total: 0 };
          }
          return await getTimelinePage({
            page: params.page?.currentPage || 1,
            pageSize: params.page?.pageSize || 20,
            profileId: formValues.profileId,
          });
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
  },
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid :table-title="$t('record.timeline.list')">
      <template #toolbar-tools>
        <NButton type="primary" @click="onCreate" v-access:code="['record:timeline:create']">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('record.timeline.title')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
