import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

export namespace IntentDefApi {
  export interface IntentDefVO {
    id: number;
    agentId: string;
    code: string;
    name: string;
    description: string;
    category: string;
    priority: number;
    confidenceThreshold: number;
    examples: string[];
    targetNode: string;
    requireSlotFilling: boolean;
    slots: Record<string, string>;
    parameterMapping: Record<string, string>;
    slotDefaults: Record<string, string>;
    enabled: boolean;
    status: number;
    createTime: string;
    updateTime: string;
  }

  export interface IntentDefRequest {
    agentId?: string;
    code: string;
    name: string;
    description?: string;
    category?: string;
    priority?: number;
    confidenceThreshold?: number;
    examples?: string[];
    targetNode?: string;
    requireSlotFilling?: boolean;
    slots?: Record<string, string>;
    parameterMapping?: Record<string, string>;
    slotDefaults?: Record<string, string>;
    enabled?: boolean;
    status?: string;
  }
}

async function getIntentDefPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get('/api/agent/intents/page', {
    params: { pageNum: page, pageSize, ...rest },
  });
}

async function createIntentDef(data: IntentDefApi.IntentDefRequest) {
  return requestClient.post<IntentDefApi.IntentDefVO>(
    '/api/agent/intents/create',
    data,
  );
}

async function updateIntentDef(
  id: number,
  data: IntentDefApi.IntentDefRequest,
) {
  return requestClient.post<IntentDefApi.IntentDefVO>(
    '/api/agent/intents/update',
    data,
    { params: { id } },
  );
}

async function deleteIntentDef(id: number) {
  return requestClient.post('/api/agent/intents/delete', null, {
    params: { id },
  });
}

async function batchDeleteIntentDef(ids: number[]) {
  return requestClient.post('/api/agent/intents/batch-delete', ids);
}

export {
  batchDeleteIntentDef,
  createIntentDef,
  deleteIntentDef,
  getIntentDefPage,
  updateIntentDef,
};
