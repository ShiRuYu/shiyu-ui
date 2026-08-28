import { describe, expect, it } from 'vitest';

import {
  getStageLabel,
  getStatusLabel,
  getStatusType,
  jobStatusOptions,
  lifecycleStatusOptions,
  relationTypeOptions,
} from '../status';

describe('knowledge status model', () => {
  it('exposes the domain option sets used by document and graph views', () => {
    expect(lifecycleStatusOptions.map((item) => item.value)).toEqual([
      'DRAFT',
      'REVIEWING',
      'PUBLISHED',
      'ARCHIVED',
    ]);
    expect(jobStatusOptions).toHaveLength(6);
    expect(relationTypeOptions.map((item) => item.value)).toEqual([
      'PRE',
      'NEXT',
      'RELATED',
      'INCLUDE',
      'BELONG',
    ]);
  });

  it('maps known and unknown status values without hiding data', () => {
    expect(getStatusLabel()).toBe('-');
    expect(getStatusLabel('PUBLISHED')).toBe('已发布');
    expect(getStatusLabel('CUSTOM')).toBe('CUSTOM');
    expect(getStageLabel(null)).toBe('-');
    expect(getStageLabel('EMBEDDING')).toBe('向量化');
    expect(getStageLabel('CUSTOM')).toBe('CUSTOM');
  });

  it('maps status severity for the UI tag component', () => {
    expect(getStatusType()).toBe('default');
    expect(getStatusType('SUCCEEDED')).toBe('success');
    expect(getStatusType('FAILED')).toBe('error');
    expect(getStatusType('RUNNING')).toBe('warning');
    expect(getStatusType('ARCHIVED')).toBe('default');
    expect(getStatusType('UNKNOWN')).toBe('info');
  });
});
