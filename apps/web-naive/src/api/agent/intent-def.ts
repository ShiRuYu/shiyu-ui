import { requestClient } from '#/api/request';

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
    status: string;
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

async function getIntentDefPage(params: {
  agentId?: string;
  category?: string;
  page: number;
  pageSize: number;
}) {
  return requestClient.get('/intent/def/page', { params });
}

async function getIntentDefById(id: number) {
  return requestClient.get<IntentDefApi.IntentDefVO>(`/intent/def/${id}`);
}

async function createIntentDef(data: IntentDefApi.IntentDefRequest) {
  return requestClient.post<IntentDefApi.IntentDefVO>('/intent/def', data);
}

async function updateIntentDef(id: number, data: IntentDefApi.IntentDefRequest) {
  return requestClient.patch<IntentDefApi.IntentDefVO>(`/intent/def/${id}`, data);
}

async function deleteIntentDef(id: number) {
  return requestClient.delete(`/intent/def/${id}`);
}

async function deleteIntentDefBatch(ids: number[]) {
  return requestClient.delete('/intent/def/batch', { data: ids });
}

export {
  createIntentDef,
  deleteIntentDef,
  deleteIntentDefBatch,
  getIntentDefById,
  getIntentDefPage,
  updateIntentDef,
};
