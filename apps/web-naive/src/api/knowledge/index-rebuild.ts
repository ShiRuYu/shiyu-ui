import { requestClient } from '#/api/request';

export namespace KnowledgeIndexApi {
  export interface RebuildTask {
    taskId: string;
    status: string;
    progress: number;
    total: number;
    completed: number;
    startTime: string;
    endTime: string;
  }
}

async function rebuildIndex() {
  return requestClient.post<KnowledgeIndexApi.RebuildTask>(
    '/api/knowledge/rebuild-index',
  );
}

async function getRebuildTaskStatus(taskId: string) {
  return requestClient.get<KnowledgeIndexApi.RebuildTask>(
    `/api/knowledge/rebuild-index/${taskId}`,
  );
}

async function getRebuildTasks() {
  return requestClient.get<KnowledgeIndexApi.RebuildTask[]>(
    '/api/knowledge/rebuild-index',
  );
}

async function clearIndex() {
  return requestClient.delete('/api/knowledge/index');
}

export { clearIndex, getRebuildTasks, getRebuildTaskStatus, rebuildIndex };
