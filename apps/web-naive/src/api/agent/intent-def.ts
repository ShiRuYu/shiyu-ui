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

async function getIntentDefPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get('/admin/intent/page', {
    params: { pageNum: page, pageSize, ...rest },
  });
}

async function createIntentDef(data: IntentDefApi.IntentDefRequest) {
  return requestClient.post<IntentDefApi.IntentDefVO>('/admin/intent', data);
}

async function updateIntentDef(
  id: number,
  data: IntentDefApi.IntentDefRequest,
) {
  return requestClient.patch<IntentDefApi.IntentDefVO>(
    `/admin/intent/${id}`,
    data,
  );
}

async function deleteIntentDef(id: number) {
  return requestClient.delete(`/admin/intent/${id}`);
}

export { createIntentDef, deleteIntentDef, getIntentDefPage, updateIntentDef };
