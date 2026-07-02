# shiyu-ui 开发文档

> **版本**: 1.1.0  
> **框架**: Vue 3 + Vben Admin 5.x + Naive UI  
> **应用**: `web-naive`（管理后台）| `web-client`（用户前台 — 新建）  
> **分支策略**: `main` (开发分支)  
> **最后更新**: 2026-07-02

---

## 一、环境搭建

### 1.1 前置要求

```bash
node >= 22.0
pnpm >= 10.0
```

### 1.2 克隆与安装

```bash
git clone git@github.com:ShiRuYu/shiyu-ui.git
cd shiyu-ui
pnpm install     # 安装所有依赖 (monorepo)
```

### 1.3 启动开发服务器

```bash
# 管理后台 (web-naive) — Vben Admin 5.x 框架
cd apps/web-naive
pnpm dev         # 默认端口 5888

# 用户前台 (web-client) — 轻量应用
cd apps/web-client
pnpm dev         # 默认端口 5889
```

### 1.4 清除缓存

```bash
# 页面空白时第一步
rm -rf node_modules/.vite && pnpm dev
```

### 1.5 构建

```bash
pnpm build       # 生产构建 (所有 app 同时构建)
pnpm build:analyze  # 构建分析

# 单独构建
pnpm --filter @vben/web-naive build
pnpm --filter @vben/web-client build
```

---

## 二、分支管理

### 2.1 分支策略

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 开发主线 | 所有功能、修复、新页面直接推送到此分支 |
| `vue-vben-admin` | 上游跟踪 | 从 main 分出的 Vben 官方版本（含 Demo 页面和 Mock） |

### 2.2 Git 操作规范

```bash
# 提交规范
git add .
git commit -m "feat(scope): 中文描述
- bullet 1
- bullet 2"

# 合并方式 (Squash Merge)
git fetch origin main
git reset --soft <parent-of-range>
git commit -m "feat(xxx): 功能描述"
git push --force-with-lease

# 不要用 git rebase -i
# 不要用 git revert 链
```

### 2.3 Force Push 安全策略

```bash
# push --force 前必须检查远程
git fetch origin main
git log origin/main --oneline -5

# 如果远程有新提交 → cherry-pick 合并而非覆盖
git cherry-pick <commit-hash1> <commit-hash2>
git push origin main   # 无需 force
```

---

## 三、添加新功能标准流程

### 3.1 管理后台 (web-naive) 添加新页面 (后端路由模式)

**Step 1: 创建视图组件**

```bash
mkdir -p apps/web-naive/src/views/agent/my-module
touch apps/web-naive/src/views/agent/my-module/list.vue
touch apps/web-naive/src/views/agent/my-module/data.ts
touch apps/web-naive/src/views/agent/my-module/modules/form.vue
```

**Step 2: 创建 API 模块**

```typescript
// apps/web-naive/src/api/agent/my-module.ts
import { requestClient } from '#/api/request';

export function getMyModulePageApi(params?: Recordable) {
  return requestClient.get<PageResult<MyModuleItem>>('/admin/agent/my-module/page', { params });
}
export function createMyModuleApi(data: any) {
  return requestClient.post('/admin/agent/my-module', data);
}
export function updateMyModuleApi(id: number, data: any) {
  return requestClient.patch(`/admin/agent/my-module/${id}`, data);
}
export function deleteMyModuleApi(id: number) {
  return requestClient.delete(`/admin/agent/my-module/${id}`);
}
```

**Step 3: 编写列表页**

```vue
<!-- views/agent/my-module/list.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace } from 'naive-ui';
import { getTableColumns } from './data';
import { getMyModulePageApi, deleteMyModuleApi } from '#/api/agent/my-module';
import FormModal from './modules/form.vue';

const tableData = ref([]);
const loading = ref(false);
const columns = getTableColumns();
const formModalRef = ref();

async function fetchData() {
  loading.value = true;
  try {
    const res = await getMyModulePageApi();
    tableData.value = res?.items || [];
  } finally { loading.value = false; }
}

onMounted(fetchData);
</script>
```

**Step 4: 插入数据库菜单记录**

在 `auth__init.sql` 的 `menu` 表 INSERT 中添加新记录:
- `type`: CATALOG（目录）/ MENU（页面）/ BUTTON（按钮权限）
- `path`: URL 路径
- `component`: 视图组件路径（不含 `.vue`，如 `/agent/my-module/list`）
- `show`: true（可见）/ false（隐藏）
- `layout`: `"none"` 表示全屏

同时在 `role_workspace_menu` 的对应角色 INSERT 中添加关联。

**Step 5: 添加国际化**

```json
// locales/langs/zh-CN/system.json
{ "myModule": { "title": "我的模块", "name": "名称" } }
```

### 3.2 用户前台 (web-client) 添加新页面 (静态路由模式)

**Step 1: 创建视图组件**

```bash
mkdir -p apps/web-client/src/views/chat
touch apps/web-client/src/views/chat/index.vue
touch apps/web-client/src/views/chat/modules/sidebar.vue
touch apps/web-client/src/views/chat/modules/message-list.vue
```

**Step 2: 添加路由**

```typescript
// apps/web-client/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', component: () => import('#/views/_core/authentication/login.vue') },
  { path: '/chat', component: () => import('#/views/chat/index.vue'), meta: { requiresAuth: true } },
  { path: '/chat/:sessionId', component: () => import('#/views/chat/index.vue'), meta: { requiresAuth: true } },
  { path: '/agent', component: () => import('#/views/agent/square.vue'), meta: { requiresAuth: true } },
  { path: '/agent/:agentId', component: () => import('#/views/agent/detail.vue'), meta: { requiresAuth: true } },
  { path: '/space', redirect: '/space/settings' },
  { path: '/space/settings', component: () => import('#/views/space/settings.vue'), meta: { requiresAuth: true } },
  { path: '/space/history', component: () => import('#/views/space/history.vue'), meta: { requiresAuth: true } },
];
```

**Step 3: 创建 API 模块**

```typescript
// apps/web-client/src/api/chat.ts
// 可重用 packages/effects/request 的 requestClient
// 或自行封装轻量 fetch
export async function chatStream(
  data: ChatRequest,
  onMessage: (text: string) => void,
) {
  // SSE 实现，与 web-naive 模式相同
}
```

**Step 4: 注册路由模块到 `package.json` 的 `imports` 映射**

```json
{
  "imports": {
    "#/*": "./src/*",
    "#/api/*": "./src/api/*",
    "#/views/*": "./src/views/*"
  }
}
```

### 3.3 页面模板 (Naive UI 标准 CRUD)

**data.ts 模板**:

```typescript
import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import type { VbenFormSchema } from '#/adapter';
import { NButton, NSpace, NPopconfirm } from 'naive-ui';

export function getTableColumns(handleEdit: any, handleDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 150 },
    { title: '状态', key: 'status', width: 80 },
    {
      title: '操作', key: 'actions', width: 200,
      render: (row) => h(NSpace, null, {
        default: () => [
          h(NButton, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, '编辑'),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
            default: () => '确认删除？',
            trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除'),
          }),
        ],
      }),
    },
  ];
}

export function getFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: '名称', rules: 'required' },
    { component: 'Input', fieldName: 'code', label: '编码', rules: 'required' },
    { component: 'Switch', fieldName: 'status', label: '状态', defaultValue: true },
  ];
}
```

**modules/form.vue 模板**:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui';
import { createMyModuleApi, updateMyModuleApi } from '#/api/agent/my-module';

const visible = ref(false);
const formData = ref<any>({});
const isEdit = ref(false);
const emit = defineEmits(['success']);

function open(row?: any) {
  isEdit.value = !!row;
  formData.value = row ? { ...row } : { status: true };
  visible.value = true;
}
async function handleSubmit() {
  if (isEdit.value) await updateMyModuleApi(formData.value.id, formData.value);
  else await createMyModuleApi(formData.value);
  visible.value = false;
  emit('success');
}
defineExpose({ open });
</script>
```

---

## 四、SSE 流式 API 实现

### 4.1 完整 SSE 模式 (web-naive + web-client 共用)

**建议提取为共享工具函数**，存放在 `packages/effects/request/src/sse.ts`：

```typescript
// packages/effects/request/src/sse.ts
import { useAccessStore } from '@vben/stores';
import { requestClient } from './request';

export interface SseOptions {
  url: string;
  body: Record<string, any>;
  onMessage: (content: string) => void;
  onError?: (error: any) => void;
  onDone?: () => void;
}

export function createSseStream(options: SseOptions): AbortController {
  const { url, body, onMessage, onError, onDone } = options;
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const controller = new AbortController();

  fetch(`${baseURL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) { onDone?.(); break; }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const raw = trimmed.slice(5).trim();
            if (raw && raw !== '[DONE]') {
              try {
                const parsed = JSON.parse(raw);
                const content = parsed?.data?.content;
                if (content) onMessage(content);
              } catch {
                onMessage(raw);
              }
            }
          } else if (trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              const content = parsed?.data?.content;
              if (content) onMessage(content);
            } catch { /* ignore */ }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') onError?.(error);
    });

  return controller;
}
```

### 4.2 前端组件使用 SSE

```vue
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { createSseStream } from '@vben/effects/request';

const messages = ref<{ role: string; content: string }[]>([]);
const abortController = ref<AbortController | null>(null);

async function sendMessage(input: string) {
  messages.value.push({ role: 'user', content: input });
  const aiMsg = { role: 'assistant', content: '' };
  messages.value.push(aiMsg);

  abortController.value = createSseStream({
    url: '/api/agent/agent-id/executeStream',
    body: { query: input },
    onMessage: (text) => { aiMsg.content += text; },
    onDone: () => { /* 流结束 */ },
  });
}

onUnmounted(() => {
  abortController.value?.abort();
});
</script>
```

### 4.3 SSE Pitfalls

1. **手动注入 Token**: `fetch` 绕过 requestClient 拦截器，必须 `useAccessStore().accessToken`
2. **baseURL**: 用 `requestClient.getBaseUrl()` 而非内部属性
3. **跨 chunk 缓冲**: 使用 `buffer = lines.pop()` 处理分割的 SSE 行
4. **取消支持**: 返回 `AbortController`，组件 `onUnmounted` 时调用 `abort()`
5. **后端格式**: 每个 chunk 是 `{ code: 200, data: { content: "..." } }`

---

## 五、Graph 编排功能实现 (仅管理后台)

### 5.1 节点类型枚举

| NodeType | 说明 |
|----------|------|
| `DEFAULT` | 默认节点 |
| `INTENT` | 意图识别 |
| `RAG_RETRIEVAL` | RAG 检索 |
| `RAG_ENHANCEMENT` | RAG 增强 |
| `LLM_CALL` | LLM 模型调用 |
| `TOOL_CALL` | 工具调用 |
| `CONDITION` | 条件分支 |
| `TRANSFORM` | 数据转换 |
| `OUTPUT_FORMAT` | 输出格式化 |
| `AGENT_CALL` | 子 Agent 调用 |

### 5.2 Graph 数据结构

```typescript
interface GraphConfigRequest {
  name: string;
  description: string;
  startNode: string;
  endNode: string;
  nodes: Record<string, NodeConfigDTO>;
  edges: Record<string, string[]>;
  conditionalEdges: Record<string, ConditionalEdgeDTO>;
}

interface NodeConfigDTO {
  nodeName: string; description: string; nodeType: string; enabled: boolean;
  timeout: number; retryCount: number; retryInterval: number;
  errorStrategy: string; logLevel: string;
  properties: Record<string, any>; config: Record<string, any>;
}
```

### 5.3 保存 Graph 时 11 个必填字段

```typescript
nMap[n.id] = {
  nodeName: d.nodeName || n.id,
  description: d.description || '',
  nodeType: d.nodeType || '',
  enabled: d.enabled !== false,
  timeout: d.timeout ?? 30000,          // 必须
  retryCount: d.retryCount ?? 0,         // 必须
  retryInterval: d.retryInterval ?? 1000, // 必须
  errorStrategy: d.errorStrategy ?? 'THROW', // 必须
  logLevel: d.logLevel ?? 'INFO',        // 必须
  properties: d.properties ?? {},         // 必须
  config: d.config || {},
};
```

### 5.4 VueFlow + Vben Admin 冲突处理

```vue
<script setup lang="ts">
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/background/dist/style.css';
import '@vue-flow/controls/dist/style.css';

const showVueFlow = ref(false);
const { nodes, edges, onNodesChange, onEdgesChange } = useVueFlow({ id: 'editor' });

onDeactivated(() => {
  showVueFlow.value = false;
  nodes.value = [];
  edges.value = [];
});
onActivated(() => {
  if (selectedVersionId.value) {
    showVueFlow.value = true;
    loadGraph();
  }
});
onBeforeUnmount(() => { showVueFlow.value = false; });
</script>

<template>
  <div v-if="showVueFlow" class="h-full w-full">
    <VueFlow class="h-full w-full" id="editor">
      <Background /><Controls />
    </VueFlow>
  </div>
</template>
```

---

## 六、ApiSelect 组件使用规范

### 6.1 正确用法

```typescript
{
  component: 'ApiSelect',
  fieldName: 'platformId',
  label: '所属平台',
  rules: 'required',
  componentProps: {
    api: getPlatformOptions,      // ✅ 函数引用
    labelField: 'name',           // ✅ 不是 fieldNames
    valueField: 'id',
  },
}
```

### 6.2 常见错误

```typescript
// ❌ 错误1: api 传字符串
api: '/api/platform/options'

// ❌ 错误2: 用 fieldNames 而非 labelField/valueField
fieldNames: { label: 'name', value: 'id' }
```

### 6.3 包装分页接口为选项

```typescript
async function getProfileOptions() {
  const result = await getProfilePage({ page: 1, pageSize: 1000 });
  return (result?.items || []).map((p) => ({ id: p.id, name: p.name }));
}
```

---

## 七、Naive UI 关键组件注意

### 7.1 NCollapseItem 的 Header Slot

```html
<!-- ✅ 推荐 -->
<NCollapseItem name="info">
  <template #header><span>基本信息</span></template>
  ...
</NCollapseItem>
```

### 7.2 使用 useVbenModal 数据读取

```typescript
// ✅ 正确 - onOpenChange 回调
const [FormModal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const row = modalApi.getData<SomeType>();
    await nextTick();
    // row 可正确读取
  },
});
```

### 7.3 connectedComponent 模式

```typescript
// agent-list.vue
import ChatModal from '../agent/modules/chat.vue';

const [ChatModalComp, chatModalApi] = useVbenModal({
  connectedComponent: ChatModal,
  destroyOnClose: true,
});

function openChat(agent: AgentVO) {
  chatModalApi.setData({ agentId: agent.agentId }).open();
}
```

---

## 八、web-client (用户前台) 开发指南

### 8.1 与 web-naive 的差异

| 维度 | web-naive (管理后台) | web-client (用户前台) |
|------|---------------------|---------------------|
| 框架 | Vben Admin 5.x 全量 | 轻量，不依赖 Vben |
| 路由模式 | 后端动态路由 (mixed) | 前端静态路由 |
| 权限控制 | 三级 RBAC + 按钮级 Auth | 仅登录鉴权 |
| UI 组件 | Naive UI 全量 + VxeTable | Naive UI 按需加载 |
| 布局 | BasicLayout (侧边栏+Header+Tabs) | 自定义简洁布局 |
| 页面复杂度 | 复杂表格/表单/Graph编排 | 以对话/展示为主 |
| KeepAlive | 多 Tab 切换需处理冲突 | 单页，无需处理 |
| 端口 | 5888 | 5889 |

### 8.2 web-client 项目初始化步骤

```bash
# 1. 创建应用目录 (从 web-naive 复制基础配置)
mkdir -p apps/web-client/src/{api,views,router,layouts,locales,assets}
cp apps/web-naive/package.json apps/web-client/
cp apps/web-naive/vite.config.ts apps/web-client/
cp apps/web-naive/tsconfig.json apps/web-client/

# 2. 修改 package.json
# name: "@vben/web-client"
# scripts.dev: "pnpm vite --port 5889"

# 3. 注册到 pnpm-workspace.yaml（如果 apps/* 已匹配则无需操作）

# 4. 安装依赖
cd apps/web-client && pnpm install
```

### 8.3 共享 package 使用

```json
// apps/web-client/package.json
{
  "dependencies": {
    "@vben/effects": "workspace:*",    // requestClient 等
    "@vben/stores": "workspace:*",     // Pinia stores
    "@vben/utils": "workspace:*",      // 工具函数
    "@vben/types": "workspace:*",      // 类型定义
    "@vben/hooks": "workspace:*",      // 通用 hooks
    "naive-ui": "catalog:"             // UI 组件按需引入
  }
}
```

### 8.4 web-client 路由守卫

```typescript
// router/guard.ts
import { useAccessStore } from '@vben/stores';

router.beforeEach((to, from, next) => {
  const accessStore = useAccessStore();
  if (to.meta.requiresAuth && !accessStore.accessToken) {
    next('/login');
  } else {
    next();
  }
});
```

### 8.5 web-client 布局设计

```vue
<!-- layouts/AppLayout.vue -->
<template>
  <div class="app-layout">
    <TopNav>
      <NavLink to="/chat">AI 对话</NavLink>
      <NavLink to="/agent">Agent 广场</NavLink>
      <NavLink to="/space">个人空间</NavLink>
    </TopNav>
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>
```

---

## 九、国际化

### 9.1 资源文件

```json
// locales/langs/zh-CN/system.json
{
  "platform": { "title": "AI 平台管理", "name": "平台名称" }
}
```

### 9.2 在组件中使用

```vue
<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <h1>{{ t('system.platform.title') }}</h1>
</template>
```

---

## 十、调试指南

### 10.1 页面空白排查

```bash
# Step 1: 清 Vite 缓存 (90% 的情况)
rm -rf node_modules/.vite && pnpm dev

# Step 2: 获取错误信息
curl -s http://localhost:5888/src/views/agent/admin/agent-edit.vue

# Step 3: 检查控制台报错
# - VueFlow: Transition 冲突 → v-if + onDeactivated
# - 大组件空白 → v-if "暴力重建"
# - 路由 404 → 检查后端 menu.component 与 view 路径
```

### 10.2 Vite 缓存问题

```bash
rm -rf node_modules/.vite && pnpm dev
```

### 10.3 LSP 误报

```
Cannot find module '*.vue' or 'vue-router'
→ 不影响构建，node_modules 未在 VM 中完整安装
```

---

## 十一、常见 Pitfalls 速查

### 11.1 页面空白

| 原因 | 症状 | 修复 |
|------|------|------|
| Vite 缓存损坏 | 所有页面白屏 | `rm -rf node_modules/.vite && pnpm dev` |
| VueFlow Transition 冲突 | 切换 Tab 后 VueFlow 页面白屏 (web-naive) | `v-if` + `onDeactivated` |
| 大组件渲染时序 | 大型表单 Tab 切回白屏 (web-naive) | `v-if="showContent"` 暴力重建 |
| 路由指向不存在的组件 | 特定路径 404 | 删除后端 menu 记录 |
| web-client 路由未配置 | 访问 /chat 404 | 检查 router/index.ts |

### 11.2 API 调用

| 问题 | 原因 | 修复 |
|------|------|------|
| SSE 401 | 未注入 Token | 手动 `useAccessStore().accessToken` |
| SSE 连接失败 | baseURL 错误 | `requestClient.getBaseUrl()` |
| ApiSelect 不加载 | api 传了字符串 | 传函数引用 (仅 web-naive) |
| 响应 code 异常 | successCode 不匹配 | 后端设 `BizResultCode.SUC=200` |
| web-client 跨域 | 端口不同 | 配置 vite proxy 或后端 CORS |

### 11.3 Graph 编辑 (仅 web-naive)

| 问题 | 原因 | 修复 |
|------|------|------|
| 保存后字段丢失 | 缺少 11 个必填字段 | 检查 buildGraphConfig() |
| VueFlow 报错 | prop 和 store 冲突 | `<VueFlow>` 不加 `:nodes/:edges` |
| VueFlow 找不到 handle | 双重映射 | functionCondition 只返回条件键 |
| Tab 切换 VueFlow 报错 | onDeactivated 未清理 | 销毁 VueFlow + 清空数据 |

### 11.4 路由/菜单

| 问题 | 原因 | 修复 |
|------|------|------|
| 菜单重复 | `accessMode: mixed` + 静态路由 (web-naive) | 删除 `modules/*.ts` |
| 页面隐藏但可访问 | show=false 只是隐藏菜单 | 搭配 noBasicLayout 做全屏 |
| 导航参数不对 | path 与后端 menu 不一致 | 严格匹配 `push()` 路径 |

### 11.5 其他

| 问题 | 原因 | 修复 |
|------|------|------|
| NCollapseItem 警告 | title prop 警告 (web-naive) | 用 `#header` slot |
| force-push 丢失提交 | 覆盖了远程新提交 | `cherry-pick` + 正常 push |
| LSP import 报错 | node_modules 不全 | 忽略，不影响构建 |
| API 响应 genderLabel=null | 后端 Repository 未填充 | 检查 insert/update 路径 |

---

## 十二、现有功能清单 (2026-07)

### 12.1 管理后台 (web-naive) — ✅ 已完成

| 功能 | 文件 | 状态 |
|------|------|------|
| Agent 卡片列表 | `views/agent/admin/agent-list.vue` | ✅ |
| Agent 统一编辑 (3模式) | `views/agent/admin/agent-edit.vue` | ✅ |
| Agent 基本信息表单 | `views/agent/admin/agent-form.vue` | ✅ |
| 版本管理 (内联面板) | `agent-edit.vue` 内 NCollapse | ✅ |
| Graph 节点编辑弹窗 | `views/agent/admin/modules/node-form.vue` | ✅ |
| Graph 校验结果弹窗 | `views/agent/admin/modules/validate-result.vue` | ✅ |
| Agent 执行对话 (Modal) | `views/agent/agent/modules/chat.vue` | ✅ |
| 平台管理 CRUD | `views/agent/platform/` | ✅ |
| 模型管理 CRUD | `views/agent/model/` | ✅ |
| 通用 LLM 对话弹窗 | `views/agent/model/modules/chat-dialog.vue` | ✅ |
| 意图管理 CRUD | `views/agent/intent/` | ✅ |
| 用户管理 CRUD | `views/system/user/` | ✅ |
| 角色管理 CRUD + NTree | `views/system/role/` | ✅ |
| 菜单管理 CRUD | `views/system/menu/` | ✅ |
| 工作空间管理 | `views/system/workspace/` | ✅ |
| 租户管理 | `views/system/tenant/` | ✅ |
| 字典管理 | `views/common/dict/` | ✅ |
| 人物档案管理 | `views/record/profile/` | ✅ |
| 时间轴管理 | `views/record/timeline/` | ✅ |
| 仪表盘 | `views/dashboard/` | ✅ |
| 登录/认证 | `api/core/auth.ts` | ✅ |
| SSE 流式对话 | `api/agent/chat.ts` + `chat-dialog.vue` | ✅ |

### 12.2 已清理的死代码

| 文件 | 说明 |
|------|------|
| `views/agent/chat.vue` | 独立对话页 → 替换为 Modal |
| `views/agent/admin/version-list.vue` | 独立版本列表 → 内联面板 |
| `views/agent/admin/version-form.vue` | 独立版本表单 → 内联面板 |
| `apps/web-antd/` | Ant Design 实验应用 → 已删除 |
| `router/routes/modules/demos.ts` | Demo 路由 → 已删除 |

### 12.3 用户前台 (web-client) — 🔧 规划中

| 功能 | 预计文件 | 状态 |
|------|---------|------|
| 项目脚手架搭建 | - | 🔧 规划 |
| 登录/注册页 | `views/_core/authentication/` | 🔧 规划 |
| AI 对话页 (SSE 流式) | `views/chat/` | 🔧 规划 |
| 会话管理 (侧边栏) | `views/chat/modules/sidebar.vue` | 🔧 规划 |
| Agent 广场 (浏览) | `views/agent/square.vue` | 🔧 规划 |
| Agent 详情 + 对话 | `views/agent/detail.vue` | 🔧 规划 |
| 个人设置 | `views/space/settings.vue` | 🔧 规划 |
| 对话历史 | `views/space/history.vue` | 🔧 规划 |

---

## 十三、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-07-02 | 初始版本，覆盖 web-naive 管理后台 |
| 1.1.0 | 2026-07-02 | 新增 dual-app 架构：web-naive(管理后台) + web-client(用户前台)；增加模块设计章节、开发进度章节 |

