# shiyu-ui 设计文档

> **版本**: 2.0.0  
> **对应后端**: shiyu-ai (Java 21 + Spring Boot 4.x)  
> **前端框架**: Vue 3 + Vben Admin 5.x + Naive UI  
> **双应用架构**: `web-naive`（管理后台）+ `web-client`（用户前台）  
> **管理后台定位**: 覆盖后端**全部 27 个 Controller** 的管理能力  
> **最后更新**: 2026-07-02

---

## 一、项目概述

### 1.1 项目定位

shiyu-ui 是 shiyu-ai 智能体平台的前端项目，采用 **双应用（Dual App）** 架构：

| 应用 | 目录 | 定位 | 目标用户 |
|------|------|------|---------|
| **管理后台** | `apps/web-naive/` | **全量管理** — 覆盖后端所有 Controller 的 CRUD/配置/管控 | 管理员、运营人员 |
| **用户前台** | `apps/web-client/` | **消费入口** — Agent 对话、知识库搜索、个人空间等终端使用场景 | 普通终端用户 |

**关键原则**: 管理后台 = 后端全部 Controller 的管理界面；用户前台 = 后端部分 API 的用户端消费入口。

### 1.2 管理后台覆盖范围

```
后端模块              管理后台(web-naive)     用户前台(web-client)
────────────────────────────────────────────────────────────────────────
shiyu-ai-agent  Agent核心    ✅ 全部管理API        ✅ 执行/对话
shiyu-ai-auth    认证授权    ✅ 全部管理API        ✅ 登录/用户信息
shiyu-ai-record  日常记录    ✅ 全部管理API        ❌
shiyu-ai-knowledge 知识库   ✅ 全部管理API        ✅ 搜索/浏览
shiyu-ai-education 教育     ✅ 全部管理API        ❌ (预留)
shiyu-ai-core    对话引擎   ✅ 管理配置(规划)      ✅ 对话消费
shiyu-common-web 文件上传   ✅                    ✅
```

### 1.3 后端完整列表

| 序号 | 后端模块 | Controller | 基础路径 | API 数 | 管理后台页 | 用户前台页 |
|-----|---------|-----------|---------|--------|-----------|-----------|
| 1 | agent | AgentAdminController | `/admin/agent` | 7 | ✅ 有 | - |
| 2 | agent | AgentController | `/api/agent` | 7 | ✅ 有 | ✅ 有 |
| 3 | agent | AgentGraphController | `/admin/agent/{id}/version/{vid}/graph` | 10 | ✅ 有 | - |
| 4 | agent | AgentVersionController | `/admin/agent/{id}/version` | 9 | ✅ 有 | - |
| 5 | agent | AiModelController | `/ai/model` | 11 | ✅ 有 | - |
| 6 | agent | AiPlatformController | `/ai/platform` | 11 | ✅ 有 | - |
| 7 | agent | IntentDefController | `/intent/def` | 7 | ✅ 有 | - |
| 8 | agent | NodeTypeController | `/admin/agent/node-types` | 2 | ✅ 有 | - |
| 9 | auth | AuthController | `/auth` | 10 | ✅ 有 | ✅ 有 |
| 10 | auth | CaptchaController | `/auth` | 2 | ✅ 有 | ✅ 有 |
| 11 | auth | DictController | `/dict` | 7 | ✅ 有 | - |
| 12 | auth | MenuController | `/menu` | 13 | ✅ 有 | - |
| 13 | auth | RoleController | `/role` | 8 | ✅ 有 | - |
| 14 | auth | TenantController | `/tenant` | 5 | ✅ 有 | - |
| 15 | auth | UserController | `/user` | 7 | ✅ 有 | ✅ 有 |
| 16 | auth | WorkspaceController | `/workspace` | 4 | ✅ 有 | - |
| 17 | auth | TimezoneController | `/timezone` | 3 | ✅ 有 | - |
| 18 | core | ChatDemoController | `/api/chat` | 5 | 🔧 对话配置管理 | ✅ 有 |
| 19 | knowledge | KnowledgeController | `/api/v1/knowledge` | 19 | 🔧 知识点管理 | ✅ 搜索/浏览 |
| 20 | knowledge | DocumentController | `/api/v1/knowledge/documents` | 6 | 🔧 文档管理 | ✅ |
| 21 | record | ProfileController | `/api/profile` | 4 | ✅ 有 | - |
| 22 | record | RecordController | `/api/record` | 4 | ✅ 有 | - |
| 23 | record | TimelineEventController | `/api/timeline` | 5 | ✅ 有 | - |
| 24 | record | MediaController | `/api/media` | 4 | ✅ 有 | - |
| 25 | record | TagController | `/api/tag` | 5 | ✅ 有 | - |
| 26 | common | FileController | `/upload` | 1 | ✅ 有 | ✅ 有 |
| 27-37 | education | Subject/Textbook/Chapter/... | `/api/v1/*` | 56 | 🔧 教育管理 | - |

### 1.4 技术栈

```
管理后台 (web-naive):
  Vue 3.5 + Vben Admin 5.7 + Naive UI 2.44 + VxeTable 4.18
  VueFlow 1.48 (Graph编排) + Pinia 3 + Vue Router 5 + Vite 8

用户前台 (web-client):
  Vue 3.5 + Naive UI 按需引入 + Pinia 3 + Vue Router 5 + Vite 8
  SSE 流式对话 (共享 packages/effects/request)

共享层 (packages/):
  effects/request  — requestClient + SSE 工具
  stores           — Pinia stores
  utils / types / hooks / constants / locales
```

---

## 二、系统架构

### 2.1 完整双应用架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           shiyu-ui (前端)                                  │
│                                                                          │
│  ┌─────────────────────────────────────────┐  ┌───────────────────────┐  │
│  │     管理后台 web-naive (5888)             │  │ 用户前台 web-client   │  │
│  │     ──── 管理全量后端 API                 │  │     ──── 消费入口     │  │
│  │                                         │  │     (5889)            │  │
│  │  Agent管理 Graph编排 平台/模型/意图        │  │  AI对话              │  │
│  │  用户/角色/菜单 租户/工作空间 字典/时区     │  │  Agent广场           │  │
│  │  日常记录(人物/时间轴/媒体/标签)           │  │  知识库搜索/浏览      │  │
│  │  知识库管理(知识点/文档/索引/关系)          │  │   个人空间           │  │
│  │  教育管理(学科/教材/章节/课程/试卷/题库)    │  │                     │  │
│  │  对话配置/文件管理                        │  │                     │  │
│  │  仪表盘                                 │  │                     │  │
│  └──────────┬──────────────────────────────┘  └──────────┬────────────┘  │
│             │                                            │                │
│             └──────────────┬──────────────────────────────┘                │
│                            │                                            │
│                ┌───────────┴───────────┐                                │
│                │    共享层 (packages/)    │                                │
│                │  effects/request/SSE   │                                │
│                │  stores/utils/types    │                                │
│                └───────────────────────┘                                │
└──────────────────────────────────┬────────────────────────────────────────┘
                                   │ HTTP / SSE / JSON
┌──────────────────────────────────┴────────────────────────────────────────┐
│                         shiyu-ai (后端)                                    │
│                                                                          │
│  ┌──────────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────────┐   │
│  │shiyu-ai-agent│ │shiyu-ai-   │ │shiyu-ai-    │ │shiyu-ai-         │   │
│  │ Agent核心    │ │auth 认证   │ │record 记录  │ │knowledge 知识库  │   │
│  │ :9000        │ │:9002       │ │:9005        │ │:9006             │   │
│  ├─ /admin/agent│ ├─ /auth     │ ├─ /api/      │ ├─ /api/v1/        │   │
│  ├─ /api/agent  │ ├─ /user     │ │  profile    │ │  knowledge       │   │
│  ├─ /ai/platform│ ├─ /role     │ ├─ /api/      │ ├─ /api/v1/        │   │
│  ├─ /ai/model   │ ├─ /menu     │ │  timeline   │ │  knowledge/docs  │   │
│  ├─ /intent/def │ ├─ /workspace│ ├─ /api/media  │ └──────────────────┘   │
│  └──────────────┘ ├─ /tenant   │ ├─ /api/tag   │ ┌──────────────────┐   │
│  ┌──────────────┐ ├─ /dict     │ ├─ /api/record│ │shiyu-ai-         │   │
│  │shiyu-ai-core │ ├─ /timezone │ └─────────────┘ │education 教育    │   │
│  │ 对话引擎     │ └────────────┘                 │ :9007             │   │
│  │ :9001        │ ┌────────────┐                 │ ├─ /api/v1/       │   │
│  ├─ /api/chat   │ │shiyu-      │                 │ │  subject        │   │
│  └──────────────┘ │common-web  │                 │ ├─ /api/v1/       │   │
│                    │ 文件服务    │                 │ │  textbook       │   │
│                    │ ├─ /upload  │                 │ ├─ /api/v1/       │   │
│                    └────────────┘                 │ │  chapter        │   │
│                                                   │ ├─ /api/v1/       │   │
│              Sa-Token + JWT + MyBatis-Flex + DB   │ │  course/exam/.. │   │
└───────────────────────────────────────────────────┴──────────────────────┘
```

### 2.2 管理后台与后端 Controller 映射

```
管理后台侧边栏菜单树                   后端 Controller
─────────────────────────────────────────────────────────────
仪表盘
├── 分析页                             -
└── 工作空间                           -

系统管理
├── 用户管理                           UserController
├── 角色管理                           RoleController
├── 菜单管理                           MenuController
├── 工作空间管理                        WorkspaceController
├── 租户管理                           TenantController
├── 字典管理                           DictController
└── 时区设置                           TimezoneController

智能体
├── Agent管理                          AgentAdminController
│   ├── Agent编辑 (Graph+版本)          AgentGraphController
│   │                                  AgentVersionController
│   │                                  NodeTypeController
│   └── 执行对话 (Modal)               AgentController
├── 平台管理                           AiPlatformController
├── 模型管理                           AiModelController
├── 意图管理                           IntentDefController
└── 对话配置(规划)                      ChatDemoController (配置)

日常记录
├── 人物管理                           ProfileController
├── 时间轴管理                          TimelineEventController
├── 记录管理                           RecordController
├── 媒体管理                           MediaController
└── 标签管理                           TagController

知识库 (规划)
├── 知识点管理                          KnowledgeController
├── 文档管理                           DocumentController
├── 索引管理                           KnowledgeController (rebuild-index)
├── 知识图谱                           KnowledgeController (graph)
└── 关系管理                           KnowledgeController (relation)

教育管理 (规划)
├── 学科管理                           SubjectController
├── 教材管理                           TextbookController
├── 章节管理                           ChapterController
├── 课程管理                           CourseController
├── 试卷管理                           ExamController
├── 题库管理                           QuestionController
├── 学习计划管理                        StudyPlanController
├── 复习任务管理                        ReviewController
├── 学情分析                          AnalyticsController
├── 资源管理                           ResourceController
└── 错题管理                           WrongQuestionController

文件管理
└── 文件上传/管理                       FileController
```

---

## 三、后端 API 完整对照

### 3.1 Agent 管理 (`/admin/agent`) — AgentAdminController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/admin/agent/page` | 分页列表 (name, status, pageNo, pageSize) | Agent 列表 |
| GET | `/admin/agent/{id}` | 详情 (含版本) | Agent 编辑 |
| POST | `/admin/agent` | 创建 | Agent 新建 |
| PATCH | `/admin/agent/{id}` | 更新 | Agent 编辑 |
| DELETE | `/admin/agent/{id}` | 删除 | Agent 列表 |
| PUT | `/admin/agent/{id}/status` | 启用/停用 | Agent 列表 |
| GET | `/admin/agent/list/all` | 全部可用(下拉) | 下拉选择器 |

### 3.2 Agent 执行 (`/api/agent`) — AgentController

| 方法 | 端点 | 说明 | 管理后台 | 用户前台 |
|------|------|------|---------|---------|
| POST | `/api/agent/register` | 注册(编译Graph) | 编辑页保存 | - |
| GET | `/api/agent/{agentId}` | 运行时定义 | 详情 | Agent详情 |
| POST | `/api/agent/{agentId}` | 更新运行时 | 编辑 | - |
| GET/POST | `/api/agent/{agentId}/execute` | 同步执行 | 对话Modal | 对话页 |
| GET/POST | `/api/agent/{agentId}/executeStream` | SSE流式执行 | 对话Modal | 对话页 |
| POST | `/api/agent/{agentId}/version/switch` | 切换版本 | 编辑页 | - |
| GET | `/api/agent/list` | 已注册列表 | - | Agent广场 |

### 3.3 Graph 编排 (`/admin/agent/{agentId}/version/{versionId}/graph`) — AgentGraphController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/graph` | 获取Graph配置 | Agent编辑 — Graph面板 |
| PUT | `/graph` | 更新Graph配置 | Agent编辑 — 保存 |
| POST | `/graph/validate` | 校验Graph | Agent编辑 — 校验按钮 |
| POST | `/graph/node` | 添加节点 | Agent编辑 — 新增节点 |
| PUT | `/graph/node/{nodeId}` | 更新节点 | 节点编辑弹窗 |
| DELETE | `/graph/node/{nodeId}` | 删除节点 | Agent编辑 — 删除节点 |
| POST | `/graph/edge` | 添加边 | Agent编辑 — 连线 |
| DELETE | `/graph/edge` | 删除边 | Agent编辑 — 删连线 |
| GET | `/graph/canvas` | 获取画布布局 | Agent编辑 — 加载位置 |
| PUT | `/graph/canvas` | 保存画布布局 | Agent编辑 — 保存位置 |

### 3.4 版本管理 (`/admin/agent/{agentId}/version`) — AgentVersionController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/version` | 版本列表 | Agent编辑 — 版本下拉 |
| GET | `/version/{versionId}` | 版本详情 (含Graph) | Agent编辑 — 版本切换 |
| POST | `/version` | 创建版本 | Agent编辑 — 新建版本 |
| PATCH | `/version/{versionId}` | 更新版本元信息 | Agent编辑 — 编辑版本 |
| DELETE | `/version/{versionId}` | 删除版本 | Agent编辑 — 删除版本 |
| POST | `/{versionId}/publish` | 发布 | Agent编辑 — 发布按钮 |
| POST | `/{versionId}/archive` | 归档 | Agent编辑 — 归档按钮 |
| POST | `/{versionId}/activate` | 激活 | Agent编辑 — 激活按钮 |
| POST | `/{versionId}/copy` | 复制 | Agent编辑 — 复制版本 |

### 3.5 AI 平台 (`/ai/platform`) — AiPlatformController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/ai/platform/page` | 分页 (name, code) | 平台列表 |
| GET | `/ai/platform/enabled` | 已启用列表 | - |
| GET | `/ai/platform/options` | 下拉选项 | ApiSelect |
| GET | `/ai/platform/{id}` | 详情 | 编辑弹窗 |
| GET | `/ai/platform/code/{code}` | 按编码查 | - |
| GET | `/ai/platform/default` | 默认平台 | - |
| POST | `/ai/platform` | 创建 | 新建弹窗 |
| PATCH | `/ai/platform/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/ai/platform/{id}` | 删除 | 列表 |
| PUT | `/ai/platform/{id}/default` | 设为默认 | 列表操作 |
| POST | `/ai/platform/reload` | 刷新适配器 | 列表操作 |

### 3.6 AI 模型 (`/ai/model`) — AiModelController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/ai/model/page` | 分页 (platformId) | 模型列表 |
| GET | `/ai/model/platform/{platformId}` | 某平台下模型 | - |
| GET | `/ai/model/platform/by-code/{platformCode}` | 按编码查 | - |
| GET | `/ai/model/options` | 下拉选项 | ApiSelect |
| GET | `/ai/model/{id}` | 详情 | 编辑弹窗 |
| GET | `/ai/model/platform/{platformId}/default` | 平台默认模型 | - |
| POST | `/ai/model` | 创建 | 新建弹窗 |
| PATCH | `/ai/model/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/ai/model/{id}` | 删除 | 列表 |
| DELETE | `/ai/model/batch` | 批量删除 | 列表 |
| PUT | `/ai/model/{id}/default` | 设为默认 | 列表操作 |

### 3.7 意图定义 (`/intent/def`) — IntentDefController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/intent/def/page` | 分页 (agentId,name,code,category) | 意图列表 |
| GET | `/intent/def/{id}` | 详情 | 编辑弹窗 |
| POST | `/intent/def` | 创建 | 新建弹窗 |
| PATCH | `/intent/def/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/intent/def/{id}` | 删除 | 列表 |
| DELETE | `/intent/def/batch` | 批量删除 | 列表 |
| GET | `/intent/def/options` | 下拉选项 | - |

### 3.8 节点类型 (`/admin/agent/node-types`) — NodeTypeController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/admin/agent/node-types` | 所有节点类型 | Graph编辑 — 类型下拉 |
| GET | `/{nodeType}` | 按类型查 schema | Graph编辑 — 配置表单 |

### 3.9 认证 (`/auth`) — AuthController + CaptchaController

| 方法 | 端点 | 说明 | 管理后台 | 用户前台 |
|------|------|------|---------|---------|
| POST | `/auth/login` | 登录 | ✅ | ✅ |
| GET | `/auth/codes` | 权限码 | ✅ | - |
| POST | `/auth/refresh` | 刷新Token | ✅ | ✅ |
| POST | `/auth/logout` | 登出 | ✅ | ✅ |
| PATCH | `/auth/current-role` | 切换角色 | ✅ | - |
| POST | `/auth/switch-tenant` | 切换租户 | ✅ | - |
| POST | `/auth/switch-workspace` | 切换空间 | ✅ | - |
| GET | `/auth/workspaces` | 用户空间列表 | ✅ | ✅ |
| GET | `/auth/tenants` | 用户租户列表 | ✅ | ✅ |
| GET | `/auth/captcha` | 获取验证码 | ✅ | ✅ |
| POST | `/auth/captcha/validate` | 校验验证码 | ✅ | ✅ |

### 3.10 用户 (`/user`) — UserController

| 方法 | 端点 | 说明 | 管理后台 | 用户前台 |
|------|------|------|---------|---------|
| GET | `/user/info` | 当前用户信息 | ✅ | ✅ |
| GET | `/user?pageNo&pageSize` | 分页列表 | ✅ | - |
| POST | `/user` | 创建 | ✅ | - |
| PATCH | `/{userId}` | 更新 | ✅ | - |
| DELETE | `/{userId}` | 删除 | ✅ | - |
| PATCH | `/{userId}/password/reset` | 重置密码 | ✅ | - |
| PATCH | `/{userId}/password` | 修改密码 | ✅ | ✅ |

### 3.11 菜单 (`/menu`) — MenuController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/menu/all` | 全部菜单(含按钮) | 菜单列表 |
| GET | `/menu/list` | 菜单列表 | 菜单列表 |
| GET | `/menu/list/roots` | 根级菜单 | 菜单树 |
| GET | `/menu/list/children/{parentId}` | 子菜单 | 菜单树 |
| GET | `/menu/role/permissions/tree` | 角色权限树 | 角色编辑 |
| GET | `/menu/menu/tree` | 菜单树 | 菜单树 |
| GET | `/menu/tree` | 菜单树 (别名) | 菜单树 |
| POST | `/menu` | 创建 | 新建弹窗 |
| PATCH | `/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/{id}` | 删除 | 列表 |
| GET | `/menu/name-exists` | 名称唯一校验 | 表单校验 |
| GET | `/menu/path-exists` | 路径唯一校验 | 表单校验 |
| GET | `/menu/button/{parentId}` | 按钮级菜单 | - |

### 3.12 角色 (`/role`) — RoleController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/role/list` | 分页 (name) | 角色列表 |
| GET | `/role` | 所有角色 (status) | 下拉选择 |
| POST | `/role` | 创建 | 新建弹窗 |
| PATCH | `/{id}` | 更新 | 编辑弹窗 |
| PUT | `/{id}` | 强制更新 | 编辑弹窗 |
| DELETE | `/{id}` | 删除 | 列表 |
| PATCH | `/role/users/add/{id}` | 分配用户 | 用户分配弹窗 |
| PATCH | `/role/users/remove/{id}` | 移除用户 | 用户分配弹窗 |

### 3.13 工作空间 (`/workspace`) — WorkspaceController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/workspace/list` | 列表 (name) | 工作空间列表 |
| POST | `/workspace` | 创建 | 新建弹窗 |
| PATCH | `/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/{id}` | 删除 | 列表 |

### 3.14 租户 (`/tenant`) — TenantController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/tenant/all` | 全部租户 | 租户列表 |
| GET | `/{id}` | 详情 | 编辑弹窗 |
| POST | `` | 创建 | 新建弹窗 |
| PATCH | `/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/{id}` | 删除 | 列表 |

### 3.15 字典 (`/dict`) — DictController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/dict/page` | 分页 | 字典列表 |
| GET | `/{id}` | 详情 | 编辑弹窗 |
| GET | `/dict/type/{dictType}` | 按类型查 | - |
| POST | `` | 创建 | 新建弹窗 |
| PATCH | `/{id}` | 更新 | 编辑弹窗 |
| DELETE | `/{id}` | 删除 | 列表 |
| DELETE | `/batch` | 批量删除 | 列表 |

### 3.16 时区 (`/timezone`) — TimezoneController

| 方法 | 端点 | 说明 | 管理后台页面 |
|------|------|------|-------------|
| GET | `/timezone/getTimezoneOptions` | 时区选项 | 时区设置表单 |
| GET | `/timezone/getTimezone` | 当前时区 | 时区设置表单 |
| POST | `/timezone/setTimezone` | 设置时区 | 时区设置表单 |

### 3.17 日常记录 (`/api/*`) — Profile/Record/TimelineEvent/Media/Tag Controller

| 方法 | `/api/profile` | `/api/record` | `/api/timeline` | `/api/media` | `/api/tag` |
|------|---------------|---------------|-----------------|--------------|------------|
| GET /page | `/page` | `/page` | `/page?profileId` | `/page?recordId` | `/page?name` |
| GET /{id} | `/{id}` | `/{id}` | `/{id}` | `/{id}` | `/{id}` |
| POST | `` | `` | `` | `` | `` |
| PUT | `` | `` | `` | `` | `` |
| DELETE | `/{id}` | `/{id}` | `/{id}` | `/{id}` | `/{id}` |
| 扩展 | - | - | `/profile/{profileId}` | - | `/all` |

### 3.18 通用对话 (`/api/chat`) — ChatDemoController

| 方法 | 端点 | 说明 | 管理后台用途 | 用户前台用途 |
|------|------|------|-------------|-------------|
| GET | `/api/chat/platforms` | 可用平台 | 配置查看 | 对话页模型选择 |
| POST | `/api/chat/send` | 同步对话 | 后台调试 | 对话页 |
| POST | `/api/chat/send/stream` | SSE流式对话 | 后台调试 | 对话页 |
| POST | `/api/chat/send/with-memory` | 带记忆对话 | - | 对话页 |
| GET | `/api/chat/default-model` | 默认模型 | 配置查看 | 对话页 |

### 3.19 知识库 (`/api/v1/knowledge`) — KnowledgeController

| 方法 | 端点 | 说明 | 管理后台页面 | 用户前台 |
|------|------|------|-------------|---------|
| GET | `/{id}` | 知识点详情 | 编辑弹窗 | 详情页 |
| GET | `` | 知识点列表 | 列表页 | 浏览页 |
| GET | `/{id}/graph` | 知识图谱 | 图谱视图 | - |
| GET | `/{id}/path` | 学习路径 | 路径视图 | 学习路径 |
| GET | `/{id}/prerequisites` | 前置知识点 | 前置管理 | - |
| GET | `/{id}/prerequisites-list` | 前置列表 | 前置管理 | - |
| GET | `/{id}/subsequent-list` | 后续列表 | 后续管理 | - |
| POST | `` | 创建 | 新建弹窗 | - |
| PUT | `/{id}` | 更新 | 编辑弹窗 | - |
| DELETE | `/{id}` | 删除 | 列表 | - |
| POST | `/relation` | 添加关系 | 关系管理 | - |
| DELETE | `/relation` | 删除关系 | 关系管理 | - |
| POST | `/reload` | 重新加载 | 操作按钮 | - |
| GET | `/search` | 搜索 (query, topK, mode) | 搜索页 | 搜索页 |
| GET | `/search/modes` | 搜索模式 | - | 搜索筛选 |
| POST | `/rebuild-index` | 重建索引 | 索引管理 | - |
| GET | `/rebuild-index/{taskId}` | 重建进度 | 索引管理 | - |
| GET | `/rebuild-index` | 索引状态 | 索引管理 | - |
| DELETE | `/index` | 删除索引 | 索引管理 | - |

### 3.20 知识库文档 (`/api/v1/knowledge/documents`) — DocumentController

| 方法 | 端点 | 说明 | 管理后台页面 | 用户前台 |
|------|------|------|-------------|---------|
| GET | `/{id}` | 文档详情 | 编辑弹窗 | 文档阅读 |
| GET | `?keyword&topK` | 文档搜索 | 搜索页 | 搜索页 |
| GET | `/by-knowledge/{knowledgeId}` | 按知识点查 | 文档列表 | 文档列表 |
| POST | `` | 创建文档 | 新建弹窗 | - |
| PUT | `/{id}` | 更新文档 | 编辑弹窗 | - |
| DELETE | `/{id}` | 删除文档 | 列表 | - |

### 3.21 文件上传 (`/upload`) — FileController

| 方法 | 端点 | 说明 | 管理后台 | 用户前台 |
|------|------|------|---------|---------|
| POST | `/upload` | 上传文件 (MultipartFile) | ✅ | ✅ |

### 3.22 教育管理 (`/api/v1/*`) — 规划中

| Controller | 基础路径 | API 数 | 管理后台页面 |
|-----------|---------|--------|-------------|
| SubjectController | `/api/v1/subject` | 7 | 学科管理列表/表单 |
| TextbookController | `/api/v1/textbook` | 6 | 教材管理列表/表单 |
| ChapterController | `/api/v1/chapter` | 6 | 章节管理树/列表/表单 |
| CourseController | `/api/v1/course` | 7 | 课程管理列表/表单/学习 |
| ExamController | `/api/v1/exam` | 6 | 试卷管理列表/表单/提交 |
| QuestionController | `/api/v1/question` | 6 | 题库管理列表/表单 |
| StudyPlanController | `/api/v1/plan` | 7 | 学习计划列表/表单 |
| ReviewController | `/api/v1/review` | 5 | 复习任务列表/表单 |
| AnalyticsController | `/api/v1/analytics` | 6 | 学情分析看板 |
| ResourceController | `/api/v1/resource` | 6 | 资源管理列表/表单 |
| WrongQuestionController | `/api/v1/wrong-question` | 5 | 错题管理列表/表单 |

---

## 四、模块设计

### 4.1 模块划分总览

```
shiyu-ui 前端模块 (按后端 Controller 边界)
───────────────────────────────────────────────────
管理后台 (web-naive):
  agent-core         — AgentAdminController (7 API)       ✅
  agent-graph        — AgentGraphController (10 API)      ✅
  agent-version      — AgentVersionController (9 API)     ✅
  agent-execution    — AgentController (部分) (3 API)     ✅
  agent-platform     — AiPlatformController (11 API)      ✅
  agent-model        — AiModelController (11 API)         ✅
  agent-intent       — IntentDefController (7 API)        ✅
  agent-node-type    — NodeTypeController (2 API)         ✅
  system-auth        — AuthController + CaptchaController (12 API)  ✅
  system-user        — UserController (7 API)             ✅
  system-role        — RoleController (8 API)             ✅
  system-menu        — MenuController (13 API)            ✅
  system-workspace   — WorkspaceController (4 API)        ✅
  system-tenant      — TenantController (5 API)           ✅
  system-dict        — DictController (7 API)             ✅
  system-timezone    — TimezoneController (3 API)         ✅
  record-profile     — ProfileController (4 API)          ✅
  record-timeline    — TimelineEventController (5 API)    ✅
  record-record      — RecordController (4 API)           ✅
  record-media       — MediaController (4 API)            ✅
  record-tag         — TagController (5 API)              ✅
  knowledge-mgmt     — KnowledgeController (19 API)       🔧 规划
  knowledge-doc      — DocumentController (6 API)         🔧 规划
  education-subject  — SubjectController (7 API)          🔧 规划
  education-textbook — TextbookController (6 API)         🔧 规划
  education-chapter  — ChapterController (6 API)          🔧 规划
  education-course   — CourseController (7 API)           🔧 规划
  education-exam     — ExamController (6 API)             🔧 规划
  education-question — QuestionController (6 API)         🔧 规划
  education-plan     — StudyPlanController (7 API)        🔧 规划
  education-review   — ReviewController (5 API)           🔧 规划
  education-analytics— AnalyticsController (6 API)        🔧 规划
  education-resource — ResourceController (6 API)         🔧 规划
  education-wrong    — WrongQuestionController (5 API)    🔧 规划
  file-manager       — FileController (1 API)             🔧 规划
  dashboard          — (无需后端 API)                     ✅

用户前台 (web-client):
  chat-core          — ChatDemoController (5 API)         🔧 规划
  agent-square       — AgentController (部分) (2 API)     🔧 规划
  knowledge-search   — KnowledgeController (部分) (3 API) 🔧 规划
  user-center        — UserController (部分) (3 API)      🔧 规划
  auth               — AuthController (部分) (4 API)      🔧 规划
```

### 4.2 管理后台侧边栏菜单结构

```
仪表盘
├─ 分析页 (/analytics)
└─ 工作空间 (/workspace)

系统管理
├─ 用户管理 (/system/user)
├─ 角色管理 (/system/role)
├─ 菜单管理 (/system/menu)
├─ 工作空间管理 (/system/workspace)
├─ 租户管理 (/system/tenant)
├─ 字典管理 (/system/dict)
└─ 时区设置 (/system/timezone)

智能体
├─ Agent 管理 (/agent/admin/list)
├─ 平台管理 (/agent/platform)
├─ 模型管理 (/agent/model)
├─ 意图管理 (/agent/intent)
└─ 对话调试 (隐藏菜单, /agent/chat)

日常记录
├─ 人物管理 (/record/profile)
├─ 时间轴管理 (/record/timeline)
├─ 记录管理 (/record/record)
├─ 媒体管理 (/record/media)
└─ 标签管理 (/record/tag)

知识库管理 (规划)
├─ 知识点管理 (/knowledge/list)
├─ 文档管理 (/knowledge/documents)
├─ 索引管理 (/knowledge/index)
└─ 知识图谱 (/knowledge/graph)

教育管理 (规划)
├─ 学科管理 (/education/subject)
├─ 教材管理 (/education/textbook)
├─ 章节管理 (/education/chapter)
├─ 课程管理 (/education/course)
├─ 试卷管理 (/education/exam)
├─ 题库管理 (/education/question)
├─ 学习计划 (/education/plan)
├─ 复习任务 (/education/review)
├─ 学情分析 (/education/analytics)
├─ 资源管理 (/education/resource)
└─ 错题管理 (/education/wrong-question)

文件管理 (规划)
└─ 文件管理 (/file/list)
```

---

## 五、路由系统

### 5.1 管理后台路由 — 后端动态路由

所有菜单路径通过后端 `menu` 表动态注入（`accessMode: 'mixed'`），前端的 `router/routes/modules/` 仅保留 `dashboard.ts` 和 `vben.ts`（后者待清理）。

### 5.2 规划页面路由表（含 DB menu 配置参考）

| 模块 | menu.path | menu.component | show | 状态 |
|------|-----------|---------------|------|------|
| 知识库管理 | `/knowledge` | BasicLayout (目录) | true | 🔧 |
| 知识点列表 | `/knowledge/list` | `/knowledge/list` | true | 🔧 |
| 文档管理 | `/knowledge/documents` | `/knowledge/documents/list` | true | 🔧 |
| 索引管理 | `/knowledge/index` | `/knowledge/index` | true | 🔧 |
| 知识图谱 | `/knowledge/graph` | `/knowledge/graph` | true | 🔧 |
| 教育管理 | `/education` | BasicLayout (目录) | true | 🔧 |
| 学科管理 | `/education/subject` | `/education/subject/list` | true | 🔧 |
| 教材管理 | `/education/textbook` | `/education/textbook/list` | true | 🔧 |
| 章节管理 | `/education/chapter` | `/education/chapter/list` | true | 🔧 |
| 课程管理 | `/education/course` | `/education/course/list` | true | 🔧 |
| 试卷管理 | `/education/exam` | `/education/exam/list` | true | 🔧 |
| 题库管理 | `/education/question` | `/education/question/list` | true | 🔧 |
| 学习计划 | `/education/plan` | `/education/plan/list` | true | 🔧 |
| 复习任务 | `/education/review` | `/education/review/list` | true | 🔧 |
| 学情分析 | `/education/analytics` | `/education/analytics/index` | true | 🔧 |
| 资源管理 | `/education/resource` | `/education/resource/list` | true | 🔧 |
| 错题管理 | `/education/wrong-question` | `/education/wrong-question/list` | true | 🔧 |
| 文件管理 | `/file` | `/file/list` | true | 🔧 |

---

## 六、数据库核心表结构

### 6.1 Agent 相关表

```sql
ai_platform (id, name, code, base_url, api_key, temperature, max_tokens, available_models, is_default, status)
ai_model (id, platform_id, model_name, display_name, is_default, status, sort)
agent_def (id, agent_id, name, description, status)
agent_version (id, agent_id, version_number, description, status, graph_config TEXT)
intent_def (id, agent_id, code, name, category, priority, target_node, enabled)
```

### 6.2 权限相关表

```sql
tenant (id, code, name, status)
user (id, username, password, tenant_id, status, ext_info)
role (id, code, name, tenant_id, status)
menu (id, name, code, type, parent_id, path, component, icon, show, layout, keep_alive, method, order, status)
user_workspace_role (user_id, workspace_id, role_id, tenant_id)  -- PK
role_workspace_menu (role_id, workspace_id, menu_id, tenant_id)  -- PK
workspace (id, parent_id, name, tenant_id, leader, status)
```

### 6.3 日常记录表

```sql
profile (id, name, gender, avatar, address, email, ...)
record (id, profile_id, event_id, content, ...)
timeline_event (id, profile_id, event_date, title, description, ...)
media (id, record_id, type, url, ...)
tag (id, name, color, ...)
record_tag (record_id, tag_id)
```

### 6.4 知识库表

```sql
knowledge (id, name, description, subject, grade_level, ...)
document (id, knowledge_id, title, content, source, ...)
knowledge_relation (source_id, target_id, type, weight)
```

### 6.5 教育域表

```sql
subject (id, code, name, grade_level, icon, sort_order, status)
textbook (id, name, subject_code, grade, publisher, isbn)
chapter (id, textbook_id, parent_id, name, chapter_order)
course (id, name, description, subject_code, grade, textbook_id, teacher_id, total_hours, status)
exam (id, name, subject_code, grade, duration, total_score, status)
question (id, subject_code, grade, type, difficulty, content, options, answer, analysis)
study_plan (id, student_id, name, subject_code, start_date, end_date, status)
review_task (id, student_id, knowledge_id, review_date, status)
resource (id, name, type, subject_code, url, description)
wrong_question (id, student_id, question_id, wrong_answer, review_status, review_count, last_review_date)
```

---

## 七、开发进度

### 7.1 当前状态

```
管理后台 (web-naive):
  ✅ 已完成: Agent核心 + 系统管理 + 日常记录 (21个模块, 130+ API端点)
  🔧 规划中: 知识库管理 + 教育管理 + 文件管理 (15个模块, 80+ API端点)

用户前台 (web-client):
  🔧 规划中: AI对话 + Agent广场 + 知识库搜索 + 个人空间
```

### 7.2 管理后台完成度明细

| 模块 | API 端点 | 页面 | 状态 |
|------|---------|------|------|
| Agent 管理 | 7 | agent-list, agent-edit, agent-form | ✅ |
| Graph 编排 | 10 | agent-edit (VueFlow) | ✅ |
| 版本管理 | 9 | agent-edit (NCollapse) | ✅ |
| Agent 执行 | 3 | chat Modal | ✅ |
| 平台管理 | 11 | platform/list + form | ✅ |
| 模型管理 | 11 | model/list + form + chat-dialog | ✅ |
| 意图管理 | 7 | intent/list + form | ✅ |
| 节点类型 | 2 | Graph 编辑联动 | ✅ |
| 认证/用户 | 19 | login + user/list | ✅ |
| 角色管理 | 8 | role/list + form + NTree 权限回显 | ✅ |
| 菜单管理 | 13 | menu/list + form + 树形 | ✅ |
| 工作空间 | 4 | workspace/list + form | ✅ |
| 租户管理 | 5 | tenant/list + form | ✅ |
| 字典管理 | 7 | dict/list + form | ✅ |
| 时区设置 | 3 | timezone 表单 | ✅ |
| 人物管理 | 4 | profile/list + form | ✅ |
| 时间轴管理 | 5 | timeline/list + form | ✅ |
| 记录管理 | 4 | record/list + form | ✅ |
| 媒体管理 | 4 | media/list + form | ✅ |
| 标签管理 | 5 | tag/list + form | ✅ |
| 仪表盘 | - | analytics + workspace | ✅ |
| **小计** | **130+** | **21 个模块** | **✅ 完成** |
| 知识库管理 | 19 | knowledge/list + form + graph + index | 🔧 |
| 文档管理 | 6 | document/list + form | 🔧 |
| 学科管理 | 7 | subject/list + form | 🔧 |
| 教材管理 | 6 | textbook/list + form | 🔧 |
| 章节管理 | 6 | chapter/tree + form | 🔧 |
| 课程管理 | 7 | course/list + form | 🔧 |
| 试卷管理 | 6 | exam/list + form | 🔧 |
| 题库管理 | 6 | question/list + form | 🔧 |
| 学习计划 | 7 | plan/list + form | 🔧 |
| 复习任务 | 5 | review/list + form | 🔧 |
| 学情分析 | 6 | analytics/dashboard | 🔧 |
| 资源管理 | 6 | resource/list + form | 🔧 |
| 错题管理 | 5 | wrong-question/list + form | 🔧 |
| 文件管理 | 1 | file/list | 🔧 |
| 对话配置 | 5 | chat-config (规划) | 🔧 |
| **小计** | **80+** | **15 个模块** | **🔧 规划中** |

### 7.3 规划阶段优先级

| 阶段 | 模块 | API 端点 | 预估工作量 | 优先级 |
|------|------|---------|-----------|--------|
| P0 | 知识库管理 + 文档管理 | 25 | 大 | 🔴 最高 |
| P0 | 对话配置 | 5 | 小 | 🔴 最高 |
| P1 | 学科/教材/章节/课程 | 26 | 中 | 🟡 高 |
| P1 | 试卷/题库 | 12 | 中 | 🟡 高 |
| P2 | 学习计划/复习任务/错题 | 17 | 中 | 🟢 中 |
| P2 | 学情分析看板 | 6 | 中 | 🟢 中 |
| P3 | 资源管理 | 6 | 小 | ⚪ 低 |
| P3 | 文件管理 | 1 | 小 | ⚪ 低 |

