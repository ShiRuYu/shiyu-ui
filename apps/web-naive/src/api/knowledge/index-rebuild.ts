import { requestClient } from '#/api/request';

export namespace KnowledgeIndexApi {
  export interface RebuildTask {
    taskId: string;
    status: string;
    progress: number;
    total: number;
    indexed: number;
    error?: string;
    startTime: string;
    endTime: string;
  }
}

async function rebuildIndex() {
  return requestClient.post<string>('/knowledge/knowledge/index/rebuild');
}

async function getRebuildTaskStatus(taskId: string) {
  return requestClient.get<KnowledgeIndexApi.RebuildTask>(
    '/knowledge/knowledge/index/rebuild-status',
    { params: { taskId } },
  );
}

async function getRebuildTasks() {
  return requestClient.get<KnowledgeIndexApi.RebuildTask[]>(
    '/knowledge/knowledge/index/rebuild-tasks',
  );
}

async function clearIndex() {
  return requestClient.post('/knowledge/knowledge/index/clear');
}

export { clearIndex, getRebuildTasks, getRebuildTaskStatus, rebuildIndex };
