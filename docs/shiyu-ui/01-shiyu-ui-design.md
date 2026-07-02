# shiyu-ui 设计文档

> **版本**: 1.1.0  
> **对应后端**: shiyu-ai (Java 21 + Spring Boot 4.x)  
> **框架**: Vue 3 + Vben Admin 5.x (forked from vbenjs/vue-vben-admin)  
> **UI 组件库**: Naive UI + VxeTable  
> **包管理**: pnpm + Turborepo Monorepo  
> **最后更新**: 2026-07-02

---

## 一、项目概述

### 1.1 项目定位

shiyu-ui 是 shiyu-ai 智能体平台的前端项目，采用 **双应用（Dual App）** 架构：

| 应用 | 目录 | 定位 | 用户 |
|------|------|------|------|
| **管理后台** | `apps/web-naive/` | 管理员管控平台 | 管理员、运营人员 |
| **用户前台** | `apps/web-client/`（新建） | 普通用户使用入口 | 终端用户 |

- **web-naive（管理后台）** 基于 Vben Admin 5.x 框架，提供 AI Agent 的全生命周期管理（注册、编排、版本、执行）、AI 平台/模型管理、系统权限管理（三级 RBAC）、个人成长记录等后台管理功能。
- **web-client（用户前台）** 轻量级独立应用，不依赖 Vben Admin 框架，面向终端用户提供 Agent 交互对话、AI 聊天、个人空间等消费型功能。

### 1.2 核心功能域

#### 管理后台 (web-naive)

| 模块 | 说明 | 对应后端模块 |
|------|------|-------------|
| **Agent 智能体** | Agent 注册、Graph 编排（节点/边）、版本管理、执行对话 | `shiyu-ai-agent` |
| **AI 平台/模型** | 多平台 LLM 适配管理（OpenAI/DeepSeek/Ollama 等） | `shiyu-ai-agent` |
| **意图管理** | 意图定义 CRUD（分类、优先级、目标节点） | `shiyu-ai-agent` |
| **系统管理** | 用户/角色/菜单/部门/字典/租户/工作空间 CRUD | `shiyu-ai-auth` |
| **日常记录** | 人物档案、时间轴事件管理 | `shiyu-ai-record` |
| **仪表盘** | 分析页、工作空间视图 | `shiyu-ai-bootstrap` |

#### 用户前台 (web-client) — 规划中

| 模块 | 说明 | 对应后端 |
|------|------|----------|
| **AI 对话** | 通用 LLM 对话、Agent 对话（同步/流式） | `shiyu-ai-agent` |
| **Agent 广场** | 浏览可用 Agent、查看详情、对话启动 | `shiyu-ai-agent` |
| **个人空间** | 对话历史、个人设置、收藏管理 | `shiyu-ai-auth` + `shiyu-ai-agent` |
| **知识库**（规划） | 个人知识库管理、RAG 检索对话 | `shiyu-ai-knowledge` |

### 1.3 技术栈

```
┌───────────────────────────────────────────────────┐
│              管理后台 (web-naive)                    │
│ Vue 3 + Vben Admin 5.x + Naive UI + VxeTable       │
│ 路由: Vue Router 5 (后端动态路由)                    │
│ 状态: Pinia 3                                       │
│ 构建: Vite 8                                        │
├───────────────────────────────────────────────────┤
│              用户前台 (web-client)                    │
│ Vue 3 + 轻量框架（不依赖 Vben）                       │
│ UI: Naive UI 按需引入 / 自研组件                      │
│ 路由: Vue Router 5 (静态路由)                        │
│ 状态: Pinia 3                                       │
│ 构建: Vite 8                                        │
├───────────────────────────────────────────────────┤
│                     共享层                            │
│ packages/utils   — 通用工具函数                      │
│ packages/types   — TypeScript 类型定义               │
│ packages/hooks   — Composition API Hooks             │
│ packages/stores  — Pinia Store 定义                  │
│ packages/effects/request — requestClient (axios)     │
│ packages/locales — 国际化资源                        │
└───────────────────────────────────────────────────┘
```

---

## 二、系统架构

### 2.1 前后端架构总览

```
┌────────────────────────────────────────────────────────────────┐
│                     shiyu-ui (前端)                              │
│                                                                │
│  ┌────────────────────────────────┐  ┌──────────────────────┐  │
│  │     管理后台 web-naive           │  │  用户前台 web-client  │  │
│  │  ┌──────┐ ┌─────┐ ┌────────┐  │  │  ┌──────┐ ┌───────┐ │  │
│  │  │Agent │ │System│ │Record  │  │  │  │AI对话│ │Agent  │ │  │
│  │  │智能体 │ │系统管│ │日常记录 │  │  │  │      │ │广场   │ │  │
│  │  │      │ │理    │ │        │  │  │  └──────┘ └───────┘ │  │
│  │  └──────┘ └─────┘ └────────┘  │  │  ┌──────┐ ┌───────┐ │  │
│  │  Dashboard / 平台/模型/意图    │  │  │个人  │ │知识库 │ │  │
│  │                               │  │  │空间  │ │(规划) │ │  │
│  └───────────┬───────────────────┘  │  └──────┘ └───────┘ │  │
│              │                       └──────────┬───────────┘  │
│              └──────────────┬──────────────────┘              │
│                             │                                  │
│                   requestClient (Axios)                        │
│                   JWT Bearer Token + SSE                        │
└─────────────────────────────────┬──────────────────────────────┘
                                  │ HTTP / SSE
┌─────────────────────────────────┴──────────────────────────────┐
│                     shiyu-ai (后端)                              │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────────────────┐  │
│  │shiyu-agent│ │shiyu-auth│ │eduction│ │ shiyu-knowledge    │  │
│  │ Agent核心 │ │ 认证授权  │ │ 教育    │ │ 知识库(规划)      │  │
│  │  /admin/  │ │          │ │        │ │                    │  │
│  │  /api/    │ │          │ │        │ │                    │  │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └────────┬───────────┘  │
│       │             │           │                │             │
│       └─────────────┴───────────┴────────────────┘             │
│                         │                                      │
│                   Sa-Token Auth                                │
│                   MyBatis-Flex + H2/MySQL                      │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 前后端数据流

```
管理后台数据流:
  管理员操作 → web-naive 组件 → API (requestClient) → 后端 /admin/* Controller
  → Service → Repository → DB
  → 返回 Result<code=200, data=T> → 前端渲染

用户前台数据流:
  用户操作 → web-client 组件 → API (requestClient) → 后端 /api/* Controller
  → Service → Repository → DB
  → 返回 Result<code=200, data=T> → 前端渲染

流式场景 (SSE):
  用户发消息 → 组件 → fetch (原生) → 后端 SSE endpoint
  → ReadableStream 逐行解析 → 实时追加 UI
```

### 2.3 应用布局架构

#### 管理后台 (web-naive) — Vben Admin BasicLayout

```
BasicLayout (VbenAdminLayout)
  ├── Sidebar (菜单导航 — 从后端 /menu/tree 动态渲染)
  ├── Header (面包屑 + 用户信息 + 通知)
  ├── Tabs (多标签页 — 支持 KeepAlive)
  ├── Content (RouterView)
  │   ├── 普通页面 (默认 BasicLayout 包裹)
  │   └── 全屏页面 (noBasicLayout: true — 绕过 BasicLayout)
  └── Footer
```

#### 用户前台 (web-client) — 自定义布局

```
AppLayout (自定义轻量布局)
  ├── TopNav (顶部导航 — 静态路由: 对话/Agent广场/个人中心)
  ├── Content (RouterView)
  │   └── 全屏页面 (无侧边栏, 简洁界面)
  └── Footer (可选)
```

---

## 三、项目结构

### 3.1 Monorepo 工作区结构

```
shiyu-ui/
├── apps/
│   ├── web-naive/              # 管理后台 (Vben Admin 5.x + Naive UI)
│   │   └── src/
│   │       ├── api/            # API 层 (框架无关 TypeScript)
│   │       ├── views/          # 后台管理页面视图
│   │       ├── router/         # Vue Router 路由
│   │       ├── locales/        # i18n (zh-CN / en-US)
│   │       ├── preferences.ts  # Vben 应用配置
│   │       │   ├── accessMode: 'mixed'
│   │       │   ├── loginExpiredMode: 'page'/'modal'
│   │       │   └── dynamicTitle: true
│   │       └── adapter.ts      # 组件适配层
│   ├── web-client/             # 用户前台 (轻量，不依赖 Vben)
│   │   └── src/
│   │       ├── api/            # API 层
│   │       ├── views/          # 用户页面视图
│   │       ├── router/         # 静态路由
│   │       ├── layouts/        # 自定义布局
│   │       ├── locales/        # i18n
│   │       └── assets/         # 静态资源
│   └── backend-mock/           # 后端 Mock 数据
├── packages/                   # 共享包 (被 web-naive 和 web-client 共同引用)
│   ├── @core/                  # 核心包 (base/ui-kit/forward)
│   ├── effects/                # 副作用包 (request/access)
│   ├── hooks/                  # Composition API hooks
│   ├── stores/                 # Pinia stores
│   ├── constants/              # 常量
│   ├── locales/                # 国际化
│   ├── styles/                 # 全局样式
│   ├── types/                  # TypeScript 类型
│   └── utils/                  # 工具函数
├── internal/                   # 内部工具
├── scripts/                    # 构建脚本
├── docs/                       # 项目文档
│   └── shiyu-ui/               # shiyu-ui 专属文档
└── pnpm-workspace.yaml         # 工作区配置
```

### 3.2 管理后台视图目录结构 (`apps/web-naive/src/views/`)

```
views/
├── _core/                      # 核心框架页面
│   ├── about/                  # 关于
│   ├── authentication/         # 登录/注册
│   ├── fallback/               # 错误页 (403/404/500)
│   └── profile/                # 个人中心
├── agent/                      # AI 智能体模块
│   ├── admin/                  # Agent 管理 (CRUD + 编辑)
│   │   ├── agent-list.vue          # 卡片列表页
│   │   ├── agent-edit.vue          # 统一编辑页 (Graph 编排 + 版本管理)
│   │   ├── agent-form.vue          # Agent 基本信息表单
│   │   └── modules/
│   │       ├── node-form.vue        # 节点表单弹窗
│   │       └── validate-result.vue  # Graph 校验结果弹窗
│   ├── agent/                  # Agent 执行
│   │   └── modules/
│   │       └── chat.vue             # Agent 执行对话 Modal
│   ├── intent/                 # 意图管理
│   │   ├── list.vue
│   │   └── modules/
│   │       └── form.vue
│   ├── model/                  # AI 模型管理
│   │   ├── list.vue
│   │   ├── data.ts
│   │   └── modules/
│   │       ├── form.vue
│   │       └── chat-dialog.vue     # 通用 LLM 对话弹窗
│   └── platform/               # AI 平台管理
│       ├── list.vue
│       └── modules/
│           └── form.vue
├── common/                     # 通用模块
│   └── dict/                   # 字典管理
├── dashboard/                  # 仪表盘
│   ├── analytics/              # 分析页
│   └── workspace/              # 工作空间
├── demos/                      # Vben 官方示例 (待清理)
├── record/                     # 个人成长记录
│   ├── profile/                # 人物档案
│   └── timeline/               # 时间轴
└── system/                     # 系统管理
    ├── user/
    ├── role/
    ├── menu/
    ├── workspace/
    └── tenant/                 # 租户管理
```

### 3.3 用户前台视图目录结构 (`apps/web-client/src/views/`) — 规划中

```
views/
├── _core/                      # 核心页面
│   ├── authentication/         # 登录/注册
│   └── fallback/               # 错误页
├── chat/                       # AI 对话
│   ├── index.vue               # 对话主页面
│   └── modules/
│       ├── sidebar.vue         # 会话列表侧边栏
│       └── message-list.vue    # 消息列表
├── agent/                      # Agent 广场
│   ├── square.vue              # Agent 浏览/发现
│   └── detail.vue              # Agent 详情 + 对话
├── space/                      # 个人空间
│   ├── settings.vue            # 个人设置
│   ├── history.vue             # 对话历史
│   └── favorites.vue           # 收藏管理
└── knowledge/                  # 知识库 (规划)
    └── ...
```

### 3.4 管理后台 API 目录结构 (`apps/web-naive/src/api/`)

```
api/
├── agent/                      # Agent 模块 API
│   ├── index.ts                # Re-export
│   ├── admin.ts                # Agent 管理 CRUD
│   ├── agent.ts                # Agent 执行 (同步 + SSE 流式)
│   ├── chat.ts                 # 通用 LLM 对话
│   ├── graph.ts                # Graph 配置 CRUD
│   ├── node-type.ts            # 节点类型枚举
│   ├── version.ts              # Agent 版本管理
│   └── intent-def.ts           # 意图定义 CRUD
├── common/                     # 通用 API
│   ├── dict.ts                 # 字典
│   ├── index.ts
│   ├── model.ts                # AI 模型
│   └── platform.ts             # AI 平台
├── core/                       # 核心 API
│   ├── auth.ts                 # 登录/刷新 Token
│   ├── captcha.ts              # 验证码
│   ├── index.ts
│   ├── menu.ts                 # 菜单（路由）
│   └── user.ts                 # 用户信息
├── record/                     # 日常记录 API
│   ├── index.ts
│   ├── profile.ts              # 档案 CRUD
│   └── timeline.ts             # 时间线 CRUD
├── system/                     # 系统管理 API
│   ├── index.ts
│   ├── dept.ts
│   ├── menu.ts
│   ├── role.ts
│   ├── tenant.ts
│   ├── user.ts
│   └── workspace.ts
├── request.ts                  # requestClient 配置
└── index.ts                    # Re-export
```

---

## 四、路由系统

### 4.1 管理后台路由模式

**Backend Routing Mode + `accessMode: 'mixed'`**

```
前端路由模块 (modules/*.ts) + 后端 DB menu 表 = 合并渲染
```

### 4.2 管理后台路由模块文件

```
router/routes/modules/
├── dashboard.ts    — 仪表盘 (Analytics / Workspace)
└── vben.ts         — Vben Project / About (待清理)
```

- 路由模块通过 `import.meta.glob('./modules/**/*.ts')` 自动发现
- `demos.ts` 已删除
- 新页面通常通过后端的 `menu` 表动态注册，不写新路由模块

### 4.3 后端菜单与前端路由映射

| 后端 menu.path | 前端 component | 说明 |
|---------------|---------------|------|
| `/dashboard` | BasicLayout | 仪表盘目录 |
| `/system/user` | `/system/user/list` | 用户管理 |
| `/agent/admin/list` | `/agent/admin/agent-list` | Agent 管理卡片页 |
| `/agent/admin/edit` | `/agent/admin/agent-edit` | 统一编辑页（隐藏菜单） |
| `/agent/platform` | `/agent/platform/list` | 平台管理 |
| `/agent/model` | `/agent/model/list` | 模型管理 |
| `/agent/intent` | `/agent/intent/list` | 意图管理 |

### 4.4 路由注入流程

```
generateAccessible(mode, options)
  → 1. generateRoutes() — 权限过滤
  → 2. 找到 Root 路由 (path='/', component=BasicLayout)
  → 3. 遍历可访问路由:
       ├── noBasicLayout=false → 推入 root.children (有 BasicLayout 包裹)
       └── noBasicLayout=true  → router.addRoute() (全屏，无 Layout)
  → 4. generateMenus() → 侧边栏菜单
```

### 4.5 全屏页面

通过 `meta: { noBasicLayout: true }` 实现（如 Agent 对话页等），绕过 BasicLayout 直接挂载到顶级路由。

### 4.6 用户前台路由模式 — 规划

**静态路由**，前端 `router/routes/` 直接定义，不依赖后端 `menu` 表：

```typescript
const routes = [
  { path: '/login', component: Login },
  { path: '/chat', component: ChatView },
  { path: '/chat/:sessionId', component: ChatView },
  { path: '/agent', component: AgentSquare },
  { path: '/agent/:agentId', component: AgentDetail },
  { path: '/space', component: UserSpace },
  { path: '/space/settings', component: Settings },
];
```

---

## 五、权限体系

### 5.1 三级 RBAC

```
租户 (Tenant) — 多租户隔离
  └── 工作空间 (Workspace)
       └── 角色 (Role) — 角色绑定菜单权限
            └── 用户 (User) — 用户通过 user_workspace_role 获取角色
```

### 5.2 菜单权限

- **菜单表** (`menu`): 定义前端路由/组件，`show` 控制侧边栏显示，`type` 区分目录/菜单/按钮
- **角色菜单关联** (`role_workspace_menu`): 角色在指定工作空间下的菜单权限
- **按钮权限**: `type='BUTTON'` 的菜单项，前端通过 `auth` 指令或 `hasPermission` 函数控制

### 5.3 前端权限控制

```typescript
// 按钮级权限 (指令方式) — 仅管理后台需要
<!-- 有 system:user:query 权限才渲染 -->
<Auth :value="'system:user:query'">
  <NButton>查询</NButton>
</Auth>

// 菜单级 (后端动态返回，前端无感知)
// 后端返回的 menus 已按 role_workspace_menu 过滤
```

### 5.4 用户前台权限模型

用户前台不做细粒度按钮级权限控制，仅做：
- **登录鉴权**: 未登录跳转登录页
- **路由守卫**: 未登录不可访问 `/chat`、`/space` 等受保护路由
- **接口权限**: 后端 API 通过 `/api/*` 端点校验用户身份

---

## 六、后端 API 端点对照

### 6.1 Agent 管理 (管理后台)

| 前端函数 | 后端端点 | 方法 | 说明 |
|---------|---------|------|------|
| `getAgentPageApi` | `/admin/agent/page` | GET | Agent 分页列表 |
| `getAgentDetailApi` | `/admin/agent/{id}` | GET | Agent 详情（含版本） |
| `createAgentApi` | `/admin/agent` | POST | 创建 Agent |
| `updateAgentApi` | `/admin/agent/{id}` | PATCH | 更新 Agent |
| `deleteAgentApi` | `/admin/agent/{id}` | DELETE | 删除 Agent |
| `getAgentListAllApi` | `/admin/agent/list/all` | GET | 全部可用 Agent（下拉选项） |

### 6.2 Agent 执行 (管理后台 + 用户前台共用)

| 前端函数 | 后端端点 | 方法 | 说明 |
|---------|---------|------|------|
| `executeAgentApi` | `/api/agent/{agentId}/execute` | POST | 同步执行 |
| `executeAgentStreamApi` | `/api/agent/{agentId}/executeStream` | POST | SSE 流式执行 |

### 6.3 版本管理 (管理后台)

| 前端函数 | 后端端点 | 方法 | 说明 |
|---------|---------|------|------|
| `getVersionListApi` | `/admin/agent/{agentId}/version` | GET | 版本列表 |
| `getVersionDetailApi` | `/admin/agent/{agentId}/version/{versionId}` | GET | 版本详情（含 Graph） |
| `createVersionApi` | `/admin/agent/{agentId}/version` | POST | 创建版本 |
| `publishVersionApi` | `.../{versionId}/publish` | POST | 发布 |
| `activateVersionApi` | `.../{versionId}/activate` | POST | 激活 |
| `archiveVersionApi` | `.../{versionId}/archive` | POST | 归档 |
| `copyVersionApi` | `.../{versionId}/copy` | POST | 复制 |

### 6.4 Graph 编排 (管理后台)

| 前端函数 | 后端端点 | 方法 | 说明 |
|---------|---------|------|------|
| `getGraphConfigApi` | `/admin/agent/{agentId}/version/{versionId}/graph` | GET | 获取 Graph 配置 |
| `updateGraphConfigApi` | `/admin/agent/{agentId}/version/{versionId}/graph` | PUT | 更新 Graph 配置 |
| `validateGraphApi` | `.../graph/validate` | POST | 校验 Graph |
| `saveCanvasConfigApi` | `.../graph/canvas` | PUT | 保存画布布局 |

### 6.5 系统管理 (管理后台)

| 前端函数 | 后端端点 | 方法 | 说明 |
|---------|---------|------|------|
| `loginApi` | `/auth/login` | POST | 登录 |
| `getUserInfoApi` | `/user/info` | GET | 当前用户信息 |
| `getMenuTreeApi` | `/menu/tree` | GET | 菜单树 |
| `getRolePageApi` | `/system/role/page` | GET | 角色分页 |

### 6.6 响应格式

```typescript
// 标准响应
interface Result<T> {
  code: number;     // 成功: 200
  data: T;
  message: string;
}

// 分页响应
interface PageResult<T> {
  items: T[];
  total: number;
}
```

---

## 七、关键设计模式

### 7.1 标准 CRUD 页面模式 (管理后台)

```
api/<module>/xxx.ts        — API 封装 (requestClient)
views/<module>/list.vue    — 列表页 (NDataTable / VxeTableGrid)
views/<module>/data.ts     — 表格列定义 + 表单 Schema
views/<module>/modules/form.vue  — 新增/编辑 Modal 表单
```

### 7.2 SSE 流式对话模式

```typescript
// 关键点:
// 1. 使用原生 fetch (requestClient 不支持 SSE)
// 2. 手动注入 Authorization: Bearer Token
// 3. 返回 AbortController 供取消
// 4. 跨 chunk 缓冲合并行 (buffer + lines.pop())
// 5. 解析 data: 行 + 裸 JSON 块
```

### 7.3 Graph 编排模式 (管理后台)

- **Agent 编辑页** (`agent-edit.vue`) 是 Graph 编排的核心
- 支持三种进入模式: 编辑 (?id=X)、只读 (?id=X&readonly=true)、新增 (?new=true)
- Graph 数据通过 `loadGraph()`/`buildGraphConfig()`/`handleSaveGraph()` 管理
- NodeConfig 包含 11 个必须字段
- VueFlow Transitioin 冲突: `v-if` + `onDeactivated` 兜底

### 7.4 对话模式

两种对话模式，不混淆使用：

| 模式 | 文件 | 所属App | API | 用途 |
|------|------|---------|-----|------|
| 通用 LLM 对话 | `chat-dialog.vue` | web-naive | `POST /api/lc4j/chat/stream` | 选平台+模型对话 |
| Agent 执行对话 | `chat.vue` | web-naive | `POST /api/agent/{id}/execute` | Agent Graph 执行 |
| 用户对话主页 | `chat/index.vue` | web-client (规划) | `POST /api/agent/{id}/executeStream` | 普通用户对话入口 |

### 7.5 Modal 数据读取模式

```typescript
// ✅ 正确 — 使用 onOpenChange 回调
const [FormModal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const row = modalApi.getData<SomeType>();
    await nextTick();
    // row 此时可用
  },
});

// ❌ 错误 — watch(isOpen) 在数据同步前触发
```

---

## 八、数据库核心表结构

### 8.1 Agent 相关表 (agent 数据源)

```sql
-- AI 平台
ai_platform (id, name, code, base_url, api_key, temperature, 
             max_tokens, available_models, is_default, status)

-- AI 模型
ai_model (id, platform_id, model_name, display_name, 
          is_default, status, sort)

-- Agent 定义
agent_def (id, agent_id, name, description, status)

-- Agent 版本
agent_version (id, agent_id, version_number, description, 
              status -- DRAFT/PUBLISHED/ARCHIVED
              graph_config TEXT -- 完整 Graph JSON)

-- 意图定义
intent_def (id, agent_id, code, name, category, 
           priority, target_node, enabled)
```

### 8.2 权限相关表 (auth 数据源)

```sql
-- 租户
tenant (id, code, name, status)

-- 用户
user (id, username, password, tenant_id, status, ext_info)

-- 角色
role (id, code, name, tenant_id, status)

-- 菜单 (前端路由 + 按钮权限)
menu (id, name, code, type -- CATALOG/MENU/BUTTON,
      parent_id, path, component, icon, show, layout, 
      keep_alive, method, order, status)

-- 用户-工作空间-角色关联 (权限唯一入口)
user_workspace_role (user_id, workspace_id, role_id, tenant_id)

-- 角色-工作空间-菜单关联
role_workspace_menu (role_id, workspace_id, menu_id, tenant_id)

-- 工作空间
workspace (id, parent_id, name, tenant_id, leader, status)
```

---

## 九、前端-后端对接规范

### 9.1 请求流程

```
前端组件 → API 函数 → requestClient  
  → 自动注入: Bearer Token, Content-Type
  → 响应拦截: code=200 解 data, code!=200 弹 message
  → 401 拦截: 自动跳转登录页 / 弹出登录 Modal
```

### 9.2 SSE 特殊处理

```
前端组件 → fetch(url, { headers: { Authorization: 'Bearer xxx' } })
  → ReadableStream reader
  → 逐行解析 data: { code: 200, data: { content: "..." } }
  → 实时追加到消息列表
  → AbortController 控制取消
```

### 9.3 枚举字段前后端对接

- 后端 DO 存 Integer code，BO 扩展 String label
- 前端 API 类型定义包含 `gender?: number` + `genderLabel?: string`
- 表单提交用 code（数字），列表展示用 label（字符串）
- 后端 Repository 层在 DO→BO 转换后填充 label
- 示例: `GenderEnum.MALE(0, "男")` → 列表显示"男"，表单提交 0

---

## 十、性能与访问模式

### 10.1 页面布局选择 (管理后台)

| 布局 | 适用场景 | 组件 |
|------|----------|------|
| VxeTableGrid | 结构化数据、分页/排序/导出 | `<VbenVxeGrid>` |
| NDataTable | 简单列表 | `<NDataTable>` |
| NGrid + NCard 卡片 | 展示型数据、视觉区分 | Naive UI 原生组件 |

### 10.2 数据加载策略

| 场景 | 策略 |
|------|------|
| 列表页首次加载 | `onMounted → fetchData()` |
| 分页/搜索 | 参数变化 → 重新 fetch |
| Modal 编辑后刷新 | emit('success') → parent fetchData() |
| Tab 切换 | KeepAlive + `onActivated` 选择性刷新 |
| Graph 编辑页 | `onActivated` 重建 VueFlow |

### 10.3 KeepAlive + Transition 冲突修复

```typescript
// VueFlow 组件: 必须 v-if + onDeactivated (仅管理后台需要)
const showVueFlow = ref(false);
onDeactivated(() => { showVueFlow.value = false; nodes.value = []; edges.value = []; });
onActivated(() => { showVueFlow.value = true; loadGraph(); });

// 大表单组件: v-if 暴力重建 (仅管理后台需要)
const showContent = ref(true);
onDeactivated(() => { showContent.value = false; });
onActivated(async () => { showContent.value = true; await nextTick(); reloadData(); });
```

---

## 十一、模块设计

### 11.1 模块划分总览

```
shiyu-ui 模块划分 (按业务域)
├── agent-core          # Agent 核心 (管理 + 执行)
├── agent-platform      # AI 平台/模型管理
├── agent-intent        # 意图管理
├── system-auth         # 系统权限 (用户/角色/菜单)
├── system-workspace    # 工作空间/租户管理
├── system-dict         # 字典管理
├── record              # 日常记录
├── dashboard           # 仪表盘
├── chat                # 通用 AI 对话 (web-client 主模块)
├── user-space          # 个人空间 (web-client)
└── knowledge           # 知识库 (规划)
```

### 11.2 管理后台模块设计 (web-naive)

| 模块 | 页面 | 组件 | API | 数据依赖 |
|------|------|------|-----|---------|
| **AgentCore** | agent-list, agent-edit, agent-form, chat | node-form, validate-result | admin.ts, agent.ts, graph.ts, version.ts | `agent_def`, `agent_version` |
| **Platform** | platform/list, platform/form | - | common/platform.ts | `ai_platform` |
| **Model** | model/list, model/form, chat-dialog | - | common/model.ts | `ai_model`, `ai_platform` |
| **Intent** | intent/list, intent/form | - | agent/intent-def.ts | `intent_def` |
| **SystemUser** | system/user/list, system/user/form | - | system/user.ts | `user`, `role` |
| **SystemRole** | system/role/list, system/role/form | NTree 菜单回显 | system/role.ts | `role`, `menu` |
| **SystemMenu** | system/menu/list, system/menu/form | - | system/menu.ts | `menu` |
| **SystemWorkspace** | system/workspace | - | system/workspace.ts | `workspace` |
| **SystemTenant** | system/tenant | - | system/tenant.ts | `tenant` |
| **SystemDict** | common/dict | - | common/dict.ts | `dict` |
| **RecordProfile** | record/profile | profile/form | record/profile.ts | `profile` |
| **RecordTimeline** | record/timeline | timeline/form | record/timeline.ts | `timeline_event` |
| **Dashboard** | analytics, workspace | 图表组件 | - | 各统计 API |

### 11.3 用户前台模块设计 (web-client) — 规划

| 模块 | 页面 | 组件 | API | 说明 |
|------|------|------|-----|------|
| **Chat** | `/chat`, `/chat/:sessionId` | sidebar, message-list, input-bar | `POST /api/lc4j/chat/stream` | 通用 LLM 对话，选模型对话 |
| **AgentSquare** | `/agent`, `/agent/:agentId` | agent-card, agent-detail | `GET /api/agent/{id}` | 浏览可用 Agent，查看详情后对话 |
| **AgentChat** | Agent 详情内对话 | chat-bubble, streaming-text | `POST /api/agent/{agentId}/executeStream` | Agent Graph 执行对话 |
| **UserSpace** | `/space/settings`, `/space/history` | settings-form, history-list | `GET /user/info` | 个人设置、对话历史 |

### 11.4 共享模块设计 (packages/)

| 包 | 职责 | 关键暴露 |
|----|------|---------|
| `effects/request` | Axios 封装、Token 管理、SSE 工具 | `requestClient`, `setupSseStream()` |
| `stores` | 全局状态 | `useAccessStore`, `useUserStore` |
| `hooks` | 通用 Hooks | `useSseChat`, `usePagination` |
| `types` | 全局类型 | `Result<T>`, `PageResult<T>`, API 枚举 |
| `utils` | 工具函数 | `dateFormat`, `jsonParse`, `debounce` |
| `constants` | 常量 | API 前缀、状态枚举 |

---

## 十二、开发进度

### 12.1 当前状态 (2026-07-02)

```
管理后台 (web-naive): ✅ 基本完成 (90%)
用户前台 (web-client): 🔧 规划中 (0%)
```

### 12.2 管理后台完成度

| 模块 | 状态 | 说明 |
|------|------|------|
| Agent 卡片列表 | ✅ 完成 | CRUD + 卡片布局 + 对话/编辑入口 |
| Agent 统一编辑 | ✅ 完成 | 3模式(编辑/只读/新增) + Graph 编排 + 版本管理 |
| Agent Graph 编排 | ✅ 完成 | 节点/边 CRUD + VueFlow + 校验 |
| 版本管理 | ✅ 完成 | 内联面板 + 发布/激活/归档/复制 |
| 平台管理 | ✅ 完成 | CRUD + 搜索 + 分页 |
| 模型管理 | ✅ 完成 | CRUD + 关联平台 + 对话弹窗 |
| 意图管理 | ✅ 完成 | CRUD + 分页 + 批量删除 |
| 通用 LLM 对话 | ✅ 完成 | SSE 流式 + 同步切换 |
| Agent 执行对话 | ✅ 完成 | Modal + SSE 流式 |
| 用户管理 | ✅ 完成 | CRUD + 分页 + 工作空间角色分配 |
| 角色管理 | ✅ 完成 | CRUD + NTree 菜单权限回显 |
| 菜单管理 | ✅ 完成 | CRUD + 树形结构 |
| 字典管理 | ✅ 完成 | CRUD + 分页 |
| 工作空间管理 | ✅ 完成 | CRUD + 树形 |
| 租户管理 | ✅ 完成 | CRUD + 分页 |
| 人物档案管理 | ✅ 完成 | CRUD + 表单 |
| 时间轴管理 | ✅ 完成 | CRUD + 表单 |
| 仪表盘 | ✅ 完成 | 分析页 + 工作空间 |
| 登录/认证 | ✅ 完成 | JWT + 验证码 + 刷新 Token |
| 路由/菜单权限 | ✅ 完成 | 后端动态路由 + mixed 模式 |
| 国际化 | ✅ 完成 | zh-CN + en-US |
| 死代码清理 | ✅ 完成 | chat.vue, version-list/form, web-antd, demos |

### 12.3 用户前台开发规划 (web-client)

| 阶段 | 功能 | 预计时间 | 优先级 |
|------|------|---------|--------|
| **P0 基础** | 脚手架搭建、登录/注册、基础布局 | TBD | 🔴 最高 |
| **P0 核心** | AI 对话页（SSE 流式）、会话管理 | TBD | 🔴 最高 |
| **P1 重要** | Agent 广场（浏览+详情+对话） | TBD | 🟡 中 |
| **P1 重要** | 个人空间（设置+对话历史） | TBD | 🟡 中 |
| **P2 一般** | 知识库管理 + RAG 对话 | TBD | 🟢 低 |

### 12.4 技术债务 (Tech Debt)

| 项 | 影响 | 优先级 |
|----|------|--------|
| 清理 `demos/` 目录死代码 | 页面污染 pageMap | 🟡 中 |
| 清理 `modules/vben.ts` 路由 | 侧边栏多余菜单 | 🟢 低 |
| Vben 依赖包瘦身（删除 antd 相关） | 构建体积 | 🟢 低 |
| web-client 共享包提取 | 双应用代码复用 | 🔴 高（启动前） |
| SSE 工具函数统一封装到 packages | 减少重复代码 | 🟡 中 |

### 12.5 版本发布计划

| 版本 | 日期 | 内容 |
|------|------|------|
| v1.0 | 2026-06 | 管理后台完整发布 |
| v1.1 | TBD | web-client 基础 + AI 对话 |
| v1.2 | TBD | Agent 广场 + 个人空间 |
| v2.0 | TBD | 知识库 + RAG 对话 |

