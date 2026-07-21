# STREAMING.md — AI Streaming 架构指南

## 一、当前实现

目前流式接口在 `api/agent/chat.ts` 和 `api/agent/agent.ts` 中直接使用 `fetch + ReadableStream`：

```ts
// api/agent/chat.ts
async function chatStream(
  data: ChatRequest,
  onMessage: (text: string) => void,
): Promise<void> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? "";

  const response = await fetch(`${baseURL}/chat/send-stream`, {
    body: JSON.stringify(data),
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    onMessage(text);
  }
}
```

**问题**：
- ❌ 没有统一管理层，每个页面需要自己调
- ❌ 没有 SSE 事件解析（直接输出原始 chunk）
- ❌ 没有 AbortController / 取消机制
- ❌ 没有自动重连
- ❌ 没有超时控制
- ❌ Token 管理在 API 层手动获取，不优雅

## 二、推荐：统一 StreamingManager 架构

```
┌─────────────────────────────────────────────┐
│               页面层                          │
│  const { connect, abort, status }          │
│       = useStreaming()                     │
├─────────────────────────────────────────────┤
│              StreamingManager                │
│  ┌───────────┐  ┌───────────┐               │
│  │ SSE       │  │ WebSocket │               │
│  ├───────────┤  ├───────────┤               │
│  │ Event     │  │ Frame     │               │
│  │ Parsing   │  │ Parsing   │               │
│  ├───────────┤  └───────────┘               │
│  │ Abort     │                              │
│  │ Control   │                              │
│  ├───────────┤                              │
│  │ Reconnect │                              │
│  │ Strategy  │                              │
│  ├───────────┤                              │
│  │ Heartbeat │                              │
│  │ Manager   │                              │
│  └───────────┘                              │
├─────────────────────────────────────────────┤
│              API Layer                       │
│  chat.ts / agent.ts                         │
└─────────────────────────────────────────────┘
```

## 三、推荐实现

### 3.1 StreamingManager 类

```ts
// src/services/streaming-manager.ts
type ConnectionType = "sse" | "websocket";
type StreamStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "aborted";

interface StreamOptions {
  url: string;
  method?: "GET" | "POST";
  body?: any;
  headers?: Record<string, string>;
  onMessage: (chunk: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

class StreamingManager {
  private status: StreamStatus = "idle";
  private abortController: AbortController | null = null;

  getStatus(): StreamStatus { return this.status; }

  async start(options: StreamOptions): Promise<void> {
    this.abortController = new AbortController();
    const signal = options.signal ?? this.abortController.signal;
    this.status = "connecting";

    try {
      const response = await fetch(options.url, {
        method: options.method ?? "POST",
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal,
      });

      this.status = "streaming";
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 事件解析
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            options.onMessage(data);
          }
        }
      }

      this.status = "completed";
      options.onDone?.();
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        this.status = "aborted";
      } else {
        this.status = "error";
        options.onError?.(err as Error);
      }
    }
  }

  abort() {
    this.abortController?.abort();
    this.status = "aborted";
  }

  reset() {
    this.status = "idle";
    this.abortController = null;
  }
}

export { StreamingManager, type StreamOptions, type StreamStatus };
```

### 3.2 Stream 状态 Composable

```ts
// src/composables/useStreaming.ts
export function useStreaming() {
  const manager = new StreamingManager();
  const status = ref<StreamStatus>("idle");
  const text = ref("");

  async function connect(options: StreamOptions) {
    text.value = "";
    status.value = "connecting";
    await manager.start({
      ...options,
      onMessage: (chunk) => {
        text.value += chunk;
        options.onMessage?.(chunk);
      },
      onDone: () => {
        status.value = "completed";
        options.onDone?.();
      },
      onError: (err) => {
        status.value = "error";
        options.onError?.(err);
      },
    });
  }

  function abort() {
    manager.abort();
    status.value = "aborted";
  }

  onUnmounted(() => manager.abort());

  return { status, text, connect, abort };
}
```

## 四、与 Chat Store 集成

```ts
// store/chat.ts
export const useChatStore = defineStore("chat", () => {
  const messages = ref<ChatMessage[]>([]);
  const { status, text, connect, abort } = useStreaming();

  async function sendMessage(prompt: string) {
    // 添加用户消息
    messages.value.push({ role: "user", content: prompt });

    // 添加空的 AI 消息
    const aiMessage: ChatMessage = { role: "assistant", content: "", id: Date.now() };
    messages.value.push(aiMessage);

    // 流式连接
    await connect({
      url: "/api/chat/send-stream",
      body: { prompt },
      onMessage: (chunk) => {
        // 逐步更新最后一条消息
        aiMessage.content += chunk;
      },
      onDone: () => { /* 完成处理 */ },
    });
  }

  return { messages, status, sendMessage, abort };
});
```

## 五、页面使用

```ts
// 页面中只需
const chatStore = useChatStore();

// 发送消息
chatStore.sendMessage("你好");

// 取消流
chatStore.abort();

// 展示
// <div v-for="msg in chatStore.messages">{{ msg.content }}</div>
// <span v-if="chatStore.status === 'streaming'">正在输入...</span>
```
