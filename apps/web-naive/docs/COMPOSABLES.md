# COMPOSABLES.md — 组合式函数

## 一、当前存在的 Composable

```
src/composables/
├── useCrudFormModal.ts      # CRUD 表单弹窗控制
├── useDeleteConfirm.ts      # 删除确认对话框
└── useCurrentStudentId.ts   # 获取当前学生 ID（教育模块）
```

### useCrudFormModal

```ts
// 标准 CRUD 弹窗控制
const { modal, openCreate, openEdit, closeModal } = useCrudFormModal();

// 打开新增弹窗
openCreate();

// 打开编辑弹窗（回填数据）
openEdit(record);

// 关闭弹窗
closeModal();
```

### useDeleteConfirm

```ts
// 删除确认
const { handleDelete } = useDeleteConfirm();

// 使用
handleDelete(() => deleteRecord(id), {
  title: '确认删除？',
  content: '删除后不可恢复',
});
```

## 二、建议新增的 Composable（按优先级排序）

### 2.1 🔴 usePagination

```ts
export function usePagination(
  fetchFn: (params: PageParams) => Promise<PageResult>,
) {
  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const loading = ref(false);
  const data = ref<any[]>([]);

  async function load(params?: Record<string, any>) {
    loading.value = true;
    try {
      const res = await fetchFn({
        page: page.value,
        pageSize: pageSize.value,
        ...params,
      });
      data.value = res.records ?? res.items;
      total.value = res.total ?? res.totalCount;
    } finally {
      loading.value = false;
    }
  }

  function onPageChange(p: number) {
    page.value = p;
    load();
  }
  function onPageSizeChange(s: number) {
    pageSize.value = s;
    load();
  }

  return {
    page,
    pageSize,
    total,
    loading,
    data,
    load,
    onPageChange,
    onPageSizeChange,
  };
}
```

### 2.2 🔴 useTable

```ts
export function useTable(fetchFn: (params: any) => Promise<PageResult>) {
  const pagination = usePagination(fetchFn);
  const searchParams = ref<Record<string, any>>({});
  const selectedKeys = ref<(string | number)[]>([]);

  async function search(params: Record<string, any>) {
    searchParams.value = params;
    pagination.page.value = 1;
    await pagination.load(params);
  }

  async function refresh() {
    await pagination.load(searchParams.value);
  }

  return { ...pagination, searchParams, selectedKeys, search, refresh };
}
```

### 2.3 🔴 useSSE

```ts
export function useSSE(url: string) {
  const isConnected = ref(false);
  const error = ref<Error | null>(null);
  let eventSource: EventSource | null = null;

  function connect(options?: {
    onMessage?: (data: any) => void;
    onError?: (err: any) => void;
  }) {
    eventSource = new EventSource(url);
    isConnected.value = true;

    eventSource.onmessage = (event) =>
      options?.onMessage?.(JSON.parse(event.data));
    eventSource.onerror = (err) => {
      error.value = err;
      options?.onError?.(err);
    };
  }

  function close() {
    eventSource?.close();
    isConnected.value = false;
  }

  return { isConnected, error, connect, close };
}
```

### 2.4 🔴 useStreamingText

```ts
export function useStreamingText() {
  const displayText = ref('');
  const isStreaming = ref(false);
  const fullText = ref('');
  let abortController: AbortController | null = null;

  async function startStream(
    fetchPromise: Promise<Response>,
    options?: { onChunk?: (text: string) => void; onDone?: () => void },
  ) {
    isStreaming.value = true;
    displayText.value = '';
    fullText.value = '';
    abortController = new AbortController();

    const response = await fetchPromise;
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText.value += chunk;
      displayText.value += chunk;
      options?.onChunk?.(chunk);
    }

    isStreaming.value = false;
    options?.onDone?.();
  }

  function cancel() {
    abortController?.abort();
    isStreaming.value = false;
  }

  return { displayText, fullText, isStreaming, startStream, cancel };
}
```

### 2.5 🔴 useRequest

```ts
export function useRequest<T>() {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const data = ref<T | null>(null);

  async function execute(fn: () => Promise<T>) {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fn();
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
    return data.value;
  }

  return { loading, error, data, execute };
}
```

### 2.6 🟡 useAbortController

```ts
export function useAbortController() {
  let controller = new AbortController();

  function getSignal() {
    return controller.signal;
  }
  function abort(reason?: string) {
    controller.abort(reason);
  }
  function reset() {
    controller = new AbortController();
  }

  return { getSignal, abort, reset };
}
```

### 2.7 🟡 useWebSocket

```ts
export function useWebSocket(url: string) {
  const isConnected = ref(false);
  const lastMessage = ref<any>(null);
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    /* 连接 + 自动重连逻辑 */
  }
  function send(data: any) {
    ws?.send(JSON.stringify(data));
  }
  function close() {
    /* 关闭连接 + 取消重连 */
  }

  return { isConnected, lastMessage, connect, send, close };
}
```

## 三、Composable 设计原则

1. **单一职责** — 每个 composable 只做一件事
2. **无副作用** — 不修改传入的参数
3. **返回响应式** — 返回 `ref` / `computed` / `reactive`
4. **可组合** — composable 之间可互相组合
5. **清理资源** — `onUnmounted` 中清理副作用

## 四、Composable 使用模式

```ts
// 推荐：在页面入口组合多个 composable
const table = useTable(fetchData);
const { loading, execute } = useRequest();
const searchForm = ref({});

async function handleSearch() {
  await table.search(searchForm.value);
}

async function handleDelete(id: number) {
  await execute(() => deleteRecord(id));
  await table.refresh();
}
```
