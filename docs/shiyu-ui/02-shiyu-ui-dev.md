# shiyu-ui 开发文档

> **版本**: 2.0.0  
> **框架**: Vue 3 + Vben Admin 5.x + Naive UI  
> **应用**: `web-naive`（管理后台）| `web-client`（用户前台 — 新建）  
> **后端 API**: 27 个 Controller，156+ 端点（覆盖 6 个后端模块）  
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
pnpm install
```

### 1.3 启动开发服务器

```bash
# 管理后台 (web-naive)
cd apps/web-naive && pnpm dev    # 端口 5888

# 用户前台 (web-client)
cd apps/web-client && pnpm dev   # 端口 5889
```

### 1.4 构建

```bash
pnpm build                         # 全部构建
pnpm --filter @vben/web-naive build  # 单独管理后台
pnpm --filter @vben/web-client build  # 单独用户前台
```

---

## 二、后端 API 架构速查

### 2.1 后端模块与端口

| 模块 | 端口 | 基础路径 | Controller 数 |
|------|------|---------|-------------|
| shiyu-ai-agent | 9000 | `/admin/agent`, `/api/agent`, `/ai/*`, `/intent/*` | 8 |
| shiyu-ai-auth | 9002 | `/auth`, `/user`, `/role`, `/menu`, `/workspace`, `/tenant`, `/dict` | 10 |
| shiyu-ai-core | 9001 | `/api/chat` | 1 |
| shiyu-ai-record | 9005 | `/api/profile`, `/api/timeline`, `/api/media`, `/api/tag`, `/api/record` | 5 |
| shiyu-ai-knowledge | 9006 | `/api/v1/knowledge`, `/api/v1/knowledge/documents` | 2 |
| shiyu-common | - | `/upload` | 1 |

### 2.2 API 前缀规则

| 前缀 | 用途 | 鉴权 | 所属 |
|------|------|------|------|
| `/admin/*` | 管理后台 CRUD | Sa-Token (admin role) | agent |
| `/api/*` | 运行时/用户端 | Sa-Token (login) | agent/core/record/knowledge |
| `/auth/*` | 认证 | 部分无需登录 | auth |
| `/user/*` | 用户 | Sa-Token (login) | auth |
| `/ai/*` | 平台/模型 | Sa-Token (login) | agent |

---

## 三、分支管理

### 3.1 策略

| 分支 | 用途 |
|------|------|
| `main` | 开发主线 (所有功能直接推送) |
| `vue-vben-admin` | 上游跟踪 (Vben 官方版本) |

### 3.2 提交规范

```bash
git commit -m "feat(scope): 中文描述
- bullet 1
- bullet 2"
```

### 3.3 合并方式 (Squash)

```bash
git fetch origin main
git reset --soft <parent-of-range>
git commit -m "feat(xxx): 功能描述"
git push --force-with-lease
```

---

## 四、管理后台 (web-naive) 开发

### 4.1 添加新页面 (后端路由模式)

**Step 1: 创建文件**

```bash
mkdir -p apps/web-naive/src/views/agent/my-module
touch apps/web-naive/src/views/agent/my-module/list.vue
touch apps/web-naive/src/views/agent/my-module/data.ts
touch apps/web-naive/src/views/agent/my-module/modules/form.vue
```

**Step 2: 创建 API 模块**

```typescript
import { requestClient } from '#/api/request';

export function getMyModulePageApi(params: Recordable) {
  return requestClient.get<PageResult<Item>>('/admin/agent/my-module/page', { params });
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

**Step 3: 插入 DB**

在 `auth__init.sql` 中添加 `menu` 记录 + `role_workspace_menu` 关联。

**Step 4: 国际化**

```json
{ "myModule": { "title": "我的模块" } }
```

### 4.2 标准 CRUD 页面模式

```
api/<module>/xxx.ts        — requestClient 封装
views/<module>/list.vue    — NDataTable / VxeTableGrid
views/<module>/data.ts     — 列定义 + 表单 Schema
views/<module>/modules/form.vue  — Modal 表单
```

### 4.3 ApiSelect 规范

```typescript
// ✅ 正确
{
  component: 'ApiSelect',
  componentProps: {
    api: getPlatformOptions,   // 函数引用
    labelField: 'name',        // 不是 fieldNames
    valueField: 'id',
  },
}

// 包装分页接口为选项
async function getOptions() {
  const res = await getPageApi({ page: 1, pageSize: 1000 });
  return (res?.items || []).map(p => ({ id: p.id, name: p.name }));
}
```

### 4.4 SSE 流式对话

```typescript
// 统一工具函数 (packages/effects/request/src/sse.ts)
createSseStream({ url, body, onMessage, onError, onDone }) → AbortController
// 1. 原生 fetch (requestClient 不支持 SSE)
// 2. 手动注入 Bearer Token
// 3. 跨 chunk 缓冲
// 4. 解析 data: 行
// 5. 返回 AbortController ⇢ onUnmounted 取消
```

### 4.5 Graph 编排

- **VueFlow**: `v-if` + `onDeactivated` + `onActivated` 解决 Transition 冲突
- **11 个必填字段**: nodeName, description, nodeType, enabled, timeout, retryCount, retryInterval, errorStrategy, logLevel, properties, config
- **VueFlow 与 prop 冲突**: `<VueFlow>` 不加 `:nodes/:edges`

---

## 五、用户前台 (web-client) 开发

### 5.1 与管理后台差异

| 维度 | 管理后台 (web-naive) | 用户前台 (web-client) |
|------|---------------------|---------------------|
| 框架 | Vben Admin 5.x 全量 | 轻量, 无 Vben |
| 路由模式 | 后端动态路由 (mixed) | 前端静态路由 |
| 权限 | 三级 RBAC + 按钮级 Auth | 仅登录鉴权 |
| UI | Naive UI 全量 + VxeTable | Naive UI 按需 |
| 布局 | BasicLayout (侧边栏+Header+Tabs) | 简洁布局 (TopNav + 内容区) |
| 复杂度 | 表格/表单/Graph编排 | 对话/卡片展示 |
| KeepAlive | 多 Tab 需处理冲突 | 单页无需处理 |
| 端口 | 5888 | 5889 |

### 5.2 项目初始化

```bash
mkdir -p apps/web-client/src/{api,views,router,layouts,locales,assets}
# 复制基础配置
cp apps/web-naive/package.json apps/web-client/
cp apps/web-naive/vite.config.ts apps/web-client/
cp apps/web-naive/tsconfig.json apps/web-client/
```

### 5.3 共享 package 使用

```json
{
  "dependencies": {
    "@vben/effects": "workspace:*",   // requestClient + SSE
    "@vben/stores": "workspace:*",    // Pinia stores
    "@vben/utils": "workspace:*",
    "@vben/types": "workspace:*",
    "@vben/hooks": "workspace:*",
    "naive-ui": "catalog:"
  }
}
```

### 5.4 web-client 路由配置

```typescript
const routes = [
  { path: '/login', component: Login },
  { path: '/chat', component: ChatIndex, meta: { requiresAuth: true } },
  { path: '/chat/:sessionId', component: ChatIndex, meta: { requiresAuth: true } },
  { path: '/agent', component: AgentSquare, meta: { requiresAuth: true } },
  { path: '/agent/:agentId', component: AgentDetail, meta: { requiresAuth: true } },
  { path: '/knowledge', component: KnowledgeIndex, meta: { requiresAuth: true } },
  { path: '/knowledge/search', component: KnowledgeSearch, meta: { requiresAuth: true } },
  { path: '/space/settings', component: SpaceSettings, meta: { requiresAuth: true } },
  { path: '/space/history', component: ChatHistory, meta: { requiresAuth: true } },
];
```

### 5.5 路由守卫

```typescript
router.beforeEach((to, from, next) => {
  const accessStore = useAccessStore();
  if (to.meta.requiresAuth && !accessStore.accessToken) next('/login');
  else next();
});
```

### 5.6 用户前台布局

```vue
<!-- layouts/AppLayout.vue -->
<template>
  <div class="app-layout">
    <TopNav>
      <NavLink to="/chat">AI 对话</NavLink>
      <NavLink to="/agent">Agent 广场</NavLink>
      <NavLink to="/knowledge">知识库</NavLink>
      <NavLink to="/space">个人空间</NavLink>
    </TopNav>
    <main class="app-content"><RouterView /></main>
  </div>
</template>
```

---

## 六、API 对接指南

### 6.1 管理后台 API 调用模式

| 方法 | 请求客户端 | Token | 错误处理 |
|------|-----------|-------|---------|
| JSON CRUD | `requestClient` | 自动 Bearer | 自动弹 message |
| SSE 流式 | `fetch` + `createSseStream` | 手动注入 | 手动处理 |
| 文件上传 | `requestClient` (FormData) | 自动 Bearer | 自动弹 message |

### 6.2 用户前台 API 调用模式

```typescript
// JSON 请求 — 共享 requestClient
import { requestClient } from '@vben/effects/request';
const res = await requestClient.get('/api/v1/knowledge/search', { params: { query } });

// SSE 流式 — 共享 createSseStream
import { createSseStream } from '@vben/effects/request';
createSseStream({ url: '/api/agent/.../executeStream', body, onMessage });
```

### 6.3 API 前缀配置

```typescript
// web-naive: apps/web-naive/.env.development
VITE_GLOB_API_URL=http://localhost:9000  // shiyu-ai-agent

// web-client: apps/web-client/.env.development
VITE_GLOB_API_URL=http://localhost:9000  // 同一后端网关
```

---

## 七、调试指南

### 7.1 页面空白排查

```bash
# Step 1: 清缓存 (90% 解决)
rm -rf node_modules/.vite && pnpm dev

# Step 2: 控制台报错信息
# VueFlow 冲突 → v-if + onDeactivated
# 大组件白屏 → v-if 暴力重建
# 路由 404 → DB menu 路径 vs view 路径不一致

# Step 3: 获取 Vite 错误
curl -s http://localhost:5888/src/views/agent/admin/agent-edit.vue
```

### 7.2 API 调试

```bash
# 直接调后端验证
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"vben","password":"123456"}'

# SSE 流式
curl -N -X POST http://localhost:9000/api/agent/test-agent/executeStream \
  -H "Authorization: Bearer xxx" \
  -H "Content-Type: application/json" \
  -d '{"query":"你好"}'
```

---

## 八、Pitfalls 速查

### 8.1 双应用通用

| 问题 | 原因 | 修复 |
|------|------|------|
| SSE 401 | fetch 绕过 requestClient | 手动注入 Bearer Token |
| SSE baseURL 错 | 未用 getBaseUrl() | `requestClient.getBaseUrl()` |
| API 响应 code!=200 | successCode 不匹配 | 后端 `BizResultCode.SUC=200` |
| LSP import 报错 | node_modules 不全 | 忽略, 不影响构建 |
| web-client 跨域 | 不同端口 | vite proxy 或后端 CORS |

### 8.2 管理后台 (web-naive)

| 问题 | 原因 | 修复 |
|------|------|------|
| 页面白屏 | Vite 缓存 | `rm -rf node_modules/.vite` |
| VueFlow Tab 白屏 | Transition 冲突 | `v-if` + `onDeactivated` |
| Graph 保存字段丢失 | 缺 11 个必填字段 | 检查 buildGraphConfig() |
| VueFlow 报错 | prop 和 store 冲突 | 不加 `:nodes/:edges` |
| 菜单重复 | mixed 模式 + 静态路由 | 删除 modules/*.ts |
| ApiSelect 不加载 | api 传字符串 | 传函数引用 |
| NCollapseItem 警告 | title prop | 用 #header slot |
| 大组件 Tab 切回白屏 | Transition 渲染时序 | v-if 暴力重建 |

### 8.3 用户前台 (web-client)

| 问题 | 原因 | 修复 |
|------|------|------|
| 路由 404 | 未注册路由 | 检查 router/index.ts |
| 401 登录循环 | 路由守卫错误 | 检查 requiresAuth 逻辑 |
| 对话消息不显示 | SSE 解析错误 | 检查 data: 行格式 |
| 知识库搜索为空 | 索引未重建 | 调 POST /rebuild-index |

---

## 九、功能清单

### 9.1 管理后台 (web-naive) — ✅ 已完成

| 功能 | 页面 | API 模块 | 状态 |
|------|------|---------|------|
| Agent 卡片列表 | agent-admin-list | agent/admin.ts | ✅ |
| Agent 统一编辑 (3模式) | agent-admin-edit | agent/admin.ts + graph.ts + version.ts | ✅ |
| Agent Graph 编排 (VueFlow) | agent-edit 内联 | agent/graph.ts | ✅ |
| 版本管理 (内联面板) | agent-edit 内联 | agent/version.ts | ✅ |
| 节点编辑弹窗 | agent-admin-modules-node-form | agent/node-type.ts | ✅ |
| Graph 校验弹窗 | agent-admin-modules-validate-result | agent/graph.ts | ✅ |
| Agent 执行对话 (Modal) | agent-agent-modules-chat | agent/agent.ts | ✅ |
| 平台管理 CRUD | agent-platform | common/platform.ts | ✅ |
| 模型管理 CRUD | agent-model | common/model.ts | ✅ |
| 通用 LLM 对话弹窗 | agent-model-chat-dialog | agent/chat.ts | ✅ |
| 意图管理 CRUD | agent-intent | agent/intent-def.ts | ✅ |
| 用户管理 CRUD | system-user | core/user.ts + system/user.ts | ✅ |
| 角色管理 CRUD + NTree | system-role | system/role.ts | ✅ |
| 菜单管理 CRUD + 树 | system-menu | system/menu.ts + core/menu.ts | ✅ |
| 工作空间管理 | system-workspace | system/workspace.ts | ✅ |
| 租户管理 | system-tenant | system/tenant.ts | ✅ |
| 字典管理 | common-dict | common/dict.ts | ✅ |
| 人物档案管理 | record-profile | record/profile.ts | ✅ |
| 时间轴管理 | record-timeline | record/timeline.ts | ✅ |
| 仪表盘 | dashboard | - | ✅ |
| 登录/认证 | _core-authentication | core/auth.ts + core/captcha.ts | ✅ |

### 9.2 用户前台 (web-client) — 🔧 规划中

| 功能 | 页面 | API | 状态 |
|------|------|-----|------|
| 项目脚手架 | - | - | 🔧 |
| 登录/注册 | _core-authentication | AuthController (login/captcha) | 🔧 |
| AI 对话 (SSE) | chat | ChatDemoController (5端点) | 🔧 |
| 会话管理 | chat/sidebar | - | 🔧 |
| Agent 广场 | agent/square | AgentController (list/details) | 🔧 |
| Agent 对话 | agent/detail | AgentController (execute/executeStream) | 🔧 |
| 知识库浏览 | knowledge | KnowledgeController (列表/详情) | 🔧 |
| 知识库搜索 | knowledge/search | KnowledgeController (search) | 🔧 |
| 个人设置 | space/settings | UserController (user/info + password) | 🔧 |
| 对话历史 | space/history | - | 🔧 |

### 9.3 已清理的死代码

| 文件 | 说明 |
|------|------|
| `views/agent/chat.vue` | 独立对话页 → 替换为 chat-dialog Modal |
| `views/agent/admin/version-list.vue` | 独立版本列表 → 内联面板 |
| `views/agent/admin/version-form.vue` | 独立版本表单 → 内联面板 |
| `apps/web-antd/` | Ant Design 实验应用 → 已删除 |
| `router/routes/modules/demos.ts` | Demo 路由 → 已删除 |

---

## 十、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-07-02 | 初始版本 |
| 1.1.0 | 2026-07-02 | 新增 dual-app 架构 |
| 2.0.0 | 2026-07-02 | 全面覆盖后端 27 个 Controller、156+ API 端点；完善双应用映射矩阵、模块设计、开发进度 |

