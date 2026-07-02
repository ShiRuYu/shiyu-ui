import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import { $t } from '#/locales';

export interface StudentRecord {
  [key: string]: any;
  id: number;
  name: string;
  school: string;
  studyDays: number;
  masteredKnowledge: number;
  accuracy: number;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.student.name') },
    { component: 'Input', fieldName: 'school', label: $t('education.student.school') },
  ];
}

export function useColumns(): VxeTableGridColumns<StudentRecord> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.student.name'), width: 150 },
    { field: 'school', title: $t('education.student.school'), width: 200 },
    { field: 'studyDays', title: $t('education.student.studyDays'), width: 100 },
    { field: 'masteredKnowledge', title: $t('education.student.masteredKnowledge'), width: 140 },
    { field: 'accuracy', title: $t('education.student.accuracy'), width: 100 },
  ];
}
