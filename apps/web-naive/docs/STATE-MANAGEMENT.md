# STATE-MANAGEMENT.md — 状态管理

## 一、当前状态

### 全局 Store（Pinia）

```
store/
├── index.ts       # 统一导出
└── auth.ts        # 认证 Store
```

**auth store** 职责：
- 登录/登出
- 用户信息
- 工作区切换
- 租户切换
- token 管理

### 页面本地状态

大部分页面使用 `ref()` / `reactive()` 管理本地状态：

```ts
// agent-list.vue 示例
const loading = ref(false);
const agents = ref<AgentVO[]>([]);
const searchName = ref("");
const total = ref(0);
```

## 二、建议新增 Store

面向 AI 平台，建议增加以下 Store：

### 2.1 Chat Store

```ts
// store/chat.ts
export const useChatStore = defineStore("chat", () => {
  const messages = ref<ChatMessage[]>([]);
  const isStreaming = ref(false);
  const currentTokenCount = ref(0);
  const toolCalls = ref<ToolCall[]>([]);
  const abortController = ref<AbortController | null>(null);

  async function sendMessage(text: string) {
    // 管理消息列表 + 流式更新
  }

  function cancelStream() {
    abortController.value?.abort();
  }

  return { messages, isStreaming, currentTokenCount, toolCalls, sendMessage, cancelStream };
});
```

### 2.2 Agent Store

```ts
// store/agent.ts
export const useAgentStore = defineStore("agent", () => {
  const currentAgent = ref<AgentVO | null>(null);
  const executionStatus = ref<"idle" | "running" | "completed" | "error">("idle");
  const executionHistory = ref<Execution[]>([]);

  async function execute(prompt: string) { /* ... */ }

  return { currentAgent, executionStatus, executionHistory, execute };
});
```

### 2.3 Knowledge Store

```ts
// store/knowledge.ts
export const useKnowledgeStore = defineStore("knowledge", () => {
  const knowledgeBases = ref<KnowledgeBase[]>([]);
  const currentKnowledge = ref<KnowledgeBase | null>(null);
  const searchResults = ref<SearchResult[]>([]);
  const indexingStatus = ref<"idle" | "indexing" | "completed">("idle");

  return { knowledgeBases, currentKnowledge, searchResults, indexingStatus };
});
```

### 2.4 其他推荐 Store

| Store | 职责 | 状态示例 |
|-------|------|---------|
| `notification` | 通知中心 | `notifications[]`, `unreadCount` |
| `task` | 后台任务 | `tasks[]`, `taskProgress` |
| `model` | AI 模型配置 | `models[]`, `platforms[]`, `currentModel` |
| `workspace` | 工作区状态 | `currentWorkspace`, `workspaces[]` |

## 三、状态管理原则

```
┌────────────────────────────────┐
│    全局 Store (Pinia)           │  跨页面共享、持久化
├────────────────────────────────┤
│    组件 Props / Emit            │  父子组件通信
├────────────────────────────────┤
│    页面级 ref / reactive        │  页面私有状态
├────────────────────────────────┤
│    Composable 内 ref            │  逻辑复用 + 局部状态
└────────────────────────────────┘
```

### 判断依据

| 状态类型 | 放在哪 | 示例 |
|---------|--------|------|
| 用户身份 | Global Store | auth store |
| 跨页面共享数据 | Global Store | chat messages |
| 页面独有 | Page `ref()` | 列表页的搜索条件 |
| 组件内部 | Component `ref()` | 展开/折叠 |
| 复用逻辑 | Composable | useTable 内的分页状态 |

## 四、Store 使用示例

```ts
// 页面中使用
import { useAuthStore } from "#/store/auth";

const authStore = useAuthStore();

// 登录
await authStore.login({ username, password });

// 获取用户信息
const userInfo = authStore.userInfo;

// 退出登录
await authStore.logout();
```
