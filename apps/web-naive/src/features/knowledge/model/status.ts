import type { TagProps } from 'naive-ui';

export const lifecycleStatusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '审核中', value: 'REVIEWING' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已归档', value: 'ARCHIVED' },
];

export const jobStatusOptions = [
  { label: '排队中', value: 'PENDING' },
  { label: '处理中', value: 'RUNNING' },
  { label: '已完成', value: 'SUCCEEDED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '失败', value: 'FAILED' },
  { label: '已取消', value: 'CANCELLED' },
];

export const relationTypeOptions = [
  { description: '目标知识依赖当前知识', label: '前置', value: 'PRE' },
  {
    description: '目标知识适合在当前知识之后学习',
    label: '后续',
    value: 'NEXT',
  },
  { description: '两个知识点存在横向关联', label: '相关', value: 'RELATED' },
  { description: '当前知识包含目标知识', label: '包含', value: 'INCLUDE' },
  { description: '当前知识归属于目标知识', label: '归属', value: 'BELONG' },
];

const statusLabels: Record<string, string> = {
  ARCHIVED: '已归档',
  BELONG: '归属',
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  DIRECT: '直接发布',
  DRAFT: '草稿',
  FAILED: '失败',
  INCLUDE: '包含',
  NEXT: '后续',
  OPTIONAL: '可选审核',
  PENDING: '排队中',
  PRE: '前置',
  PRIVATE: '私有',
  PUBLISHED: '已发布',
  READY: '解析完成',
  RELATED: '相关',
  REQUIRED: '必须审核',
  REVIEWING: '审核中',
  RUNNING: '处理中',
  SUCCEEDED: '已完成',
  TENANT: '租户可见',
};

export function getStatusLabel(value?: null | string) {
  if (!value) return '-';
  return statusLabels[value] ?? value;
}

export function getStatusType(value?: null | string): TagProps['type'] {
  if (!value) return 'default';
  if (
    ['COMPLETED', 'DIRECT', 'PUBLISHED', 'READY', 'SUCCEEDED'].includes(value)
  ) {
    return 'success';
  }
  if (value === 'FAILED') return 'error';
  if (['OPTIONAL', 'PENDING', 'REVIEWING', 'RUNNING'].includes(value)) {
    return 'warning';
  }
  if (['ARCHIVED', 'CANCELLED'].includes(value)) return 'default';
  return 'info';
}

const stageLabels: Record<string, string> = {
  CHUNKING: '内容切分',
  COMPLETED: '处理完成',
  EMBEDDING: '向量化',
  FAILED: '处理失败',
  INDEXING: '索引写入',
  PARSING: '文档解析',
  PENDING: '等待处理',
};

export function getStageLabel(value?: null | string) {
  if (!value) return '-';
  return stageLabels[value] ?? value;
}
