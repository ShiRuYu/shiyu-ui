<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { EducationExamApi } from '#/features/education/api';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { NButton, NCard, NModal, NSelect, NSpace } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteExam,
  getExamBySubject,
  getExamList,
  getQuestionBySubjectGrade,
  publishExam,
  replaceExamComposition,
} from '#/features/education/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const compositionOpen = ref(false);
const compositionExam = ref<EducationExamApi.Exam | null>(null);
const selectedQuestionIds = ref<number[]>([]);
const questionOptions = ref<{ label: string; value: number }[]>([]);
const savingComposition = ref(false);

async function onCompose(row: EducationExamApi.Exam) {
  try {
    const questions = await getQuestionBySubjectGrade(
      row.subjectCode,
      row.grade,
    );
    questionOptions.value = questions
      .filter(
        (question) =>
          question.type === 'CHOICE' &&
          question.purpose === 'EXAM_PRIVATE' &&
          question.id,
      )
      .map((question) => ({
        label: `${question.id} · ${question.title}`,
        value: question.id,
      }));
    selectedQuestionIds.value = [];
    compositionExam.value = row;
    compositionOpen.value = true;
  } catch (error) {
    console.error(error);
    message.error('题目加载失败');
  }
}

async function saveComposition() {
  const exam = compositionExam.value;
  const ids = selectedQuestionIds.value;
  if (!exam || ids.length === 0 || exam.totalScore * 100 < ids.length) {
    message.warning('请选择题目并检查总分');
    return;
  }
  savingComposition.value = true;
  try {
    const totalCents = Math.round(exam.totalScore * 100);
    const perQuestion = Math.floor(totalCents / ids.length);
    await replaceExamComposition(exam.id, [
      {
        name: '选择题',
        questions: ids.map((questionId, index) => ({
          questionId,
          score:
            (index === ids.length - 1
              ? totalCents - perQuestion * (ids.length - 1)
              : perQuestion) / 100,
        })),
      },
    ]);
    compositionOpen.value = false;
    message.success('试卷已保存，可发布考试');
  } catch (error) {
    console.error(error);
    message.error('保存试卷失败');
  } finally {
    savingComposition.value = false;
  }
}

async function onPublish(row: EducationExamApi.Exam) {
  try {
    await publishExam(row.id);
    message.success('考试已发布');
    refreshGrid();
  } catch (error) {
    console.error(error);
    message.error('发布失败，请检查试卷与考试时间');
  }
}
function onEdit(row: EducationExamApi.Exam) {
  formModalApi.setData(row).open();
}
function onCreate() {
  formModalApi.setData({}).open();
}
function onDelete(row: EducationExamApi.Exam) {
  const h = message.loading($t('common.deleting'), { duration: 0 });
  deleteExam(row.id)
    .then(() => {
      message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      refreshGrid();
    })
    .finally(() => h.destroy());
}
function onActionClick({
  code,
  row,
}: OnActionClickParams<EducationExamApi.Exam>) {
  switch (code) {
    case 'compose': {
      onCompose(row);
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
    case 'publish': {
      onPublish(row);
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
    pagerConfig: { enabled: true },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const subjectCode = formValues?.subjectCode;
          const result = subjectCode
            ? await getExamBySubject(subjectCode)
            : await getExamList(page.currentPage, page.pageSize);
          if (Array.isArray(result)) {
            return { items: result, total: result.length };
          }
          return { items: result.items, total: result.total };
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
    <NModal v-model:show="compositionOpen">
      <NCard
        class="w-[92vw] max-w-[600px]"
        title="组卷"
        closable
        @close="compositionOpen = false"
      >
        <NSpace vertical>
          <div>按选中顺序排列选择题，总分将均分到各题。</div>
          <NSelect
            v-model:value="selectedQuestionIds"
            multiple
            filterable
            :options="questionOptions"
            placeholder="选择题目"
          />
          <NButton
            type="primary"
            :loading="savingComposition"
            @click="saveComposition"
          >
            保存试卷
          </NButton>
        </NSpace>
      </NCard>
    </NModal>
    <Grid :table-title="$t('education.exam.list')">
      <template #toolbar-tools>
        <NButton
          type="primary"
          @click="onCreate"
          v-access:code="['edu:exam:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('education.exam.name')]) }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
