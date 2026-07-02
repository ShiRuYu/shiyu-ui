# shiyu-ui 设计文档

> **版本**: 2.0.0  
> **对应后端**: shiyu-ai (Java 21 + Spring Boot 4.x)  
> **前端框架**: Vue 3 + Vben Admin 5.x + Naive UI  
> **双应用架构**: `web-naive`（管理后台）+ `web-client`（用户前台）  
> **最后更新**: 2026-07-02

---

## 一、项目概述

### 1.1 项目定位

shiyu-ui 是 shiyu-ai 智能体平台的前端项目，采用 **双应用（Dual App）** 架构，面向两类用户群体：

| 应用 | 目录 | 定位 | 目标用户 | 风格 |
|------|------|------|---------|------|
| **管理后台** | `apps/web-naive/` | 管理员管控平台 | 管理员、运营 | 复杂表格、Graph编排、RBAC |
| **用户前台** | `apps/web-client/` | 普通用户使用入口 | 终端用户 | 简洁对话、卡片浏览、轻量交互 |

### 1.2 后端模块与前端App映射

```
shiyu-ai 后端模块                   管理后台(web-naive)    用户前台(web-client)
─────────────────────────────────────────────────────────────────────────
shiyu-ai-agent  Agent核心              ✅ 全部                ✅ 执行API
shiyu-ai-auth    认证授权              ✅ 全部                ✅ 登录/用户信息
shiyu-ai-record  日常记录              ✅ 全部                ❌
shiyu-ai-knowledge 知识库              ❌                    ✅ 检索/搜索
shiyu-ai-education 教育                ❌(预留)              ❌(预留)
shiyu-common-web  文件上传             ✅                    ✅
```

### 1.3 技术栈

```
管理后台 (web-naive):
  Vue 3.5 + Vben Admin 5.7 + Naive UI 2.44 + VxeTable 4.18
  VueFlow 1.48 (Graph编排) + Pinia 3 + Vue Router 5 + Vite 8

用户前台 (web-client):
  Vue 3.5 + (无 Vben 框架) + Naive UI 按需引入
  Pinia 3 + Vue Router 5 + Vite 8
  SSE 流式对话 (共享 packages/effects/request)

共享层 (packages/):
  effects/request  — requestClient + SSE 工具
  stores           — Pinia stores (useAccessStore, useUserStore)
  utils            — 工具函数
  types            — 全局类型
  hooks            — 通用 hooks
  constants        — 常量
  locales          — 国际化资源
```

---

## 二、后端 API 全面对照

### 2.1 总览

| 后端模块 | Controller | 基础路径 | API 数量 | 归属 |
|---------|-----------|---------|---------|------|
| Agent | AgentAdminController | `/admin/agent` | 6 | 管理后台 |
| Agent | AgentController | `/api/agent` | 6 | 双端共用 |
| Agent | AgentGraphController | `/admin/agent/{id}/version/{vid}/graph` | 8 | 管理后台 |
| Agent | AgentVersionController | `/admin/agent/{id}/version` | 8 | 管理后台 |
| Agent | AiModelController | `/ai/model` | 9 | 管理后台 |
| Agent | AiPlatformController | `/ai/platform` | 9 | 管理后台 |
| Agent | IntentDefController | `/intent/def` | 6 | 管理后台 |
| Agent | NodeTypeController | `/admin/agent/node-types` | 2 | 管理后台 |
| Auth | AuthController | `/auth` | 10 | 双端共用 |
| Auth | CaptchaController | `/auth` | 2 | 双端共用 |
| Auth | DictController | `/dict` | 6 | 管理后台 |
| Auth | MenuController | `/menu` | 10 | 管理后台 |
| Auth | RoleController | `/role` | 7 | 管理后台 |
| Auth | TenantController | `/tenant` | 4 | 管理后台 |
| Auth | UserController | `/user` | 7 | 双端共用 |
| Auth | WorkspaceController | `/workspace` | 4 | 管理后台 |
| Auth | TimezoneController | `/timezone` | 3 | 管理后台 |
| Core | ChatDemoController | `/api/chat` | 5 | 用户前台 |
| Knowledge | KnowledgeController | `/api/v1/knowledge` | 13 | 用户前台 |
| Knowledge | DocumentController | `/api/v1/knowledge/documents` | 5 | 用户前台 |
| Record | ProfileController | `/api/profile` | 4 | 管理后台 |
| Record | RecordController | `/api/record` | 4 | 管理后台 |
| Record | TimelineEventController | `/api/timeline` | 5 | 管理后台 |
| Record | MediaController | `/api/media` | 4 | 管理后台 |
| Record | TagController | `/api/tag` | 5 | 管理后台 |
| Common | FileController | `/upload` | 1 | 双端共用 |
| Education | (11个Controller) | `/api/v1/*` | 56 | 规划预留 |

### 2.2 Agent 管理 API (`/admin/agent`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/admin/agent/page` | Agent 分页列表 (name, status, pageNo, pageSize) | 管理后台 Agent 列表 |
| GET | `/admin/agent/{id}` | Agent 详情 | 管理后台 Agent 编辑 |
| POST | `/admin/agent` | 创建 Agent | 管理后台 Agent 新建 |
| PATCH | `/admin/agent/{id}` | 更新 Agent | 管理后台 Agent 编辑 |
| DELETE | `/admin/agent/{id}` | 删除 Agent | 管理后台 Agent 删除 |
| PUT | `/admin/agent/{id}/status` | 启用/停用 Agent | 管理后台 Agent 状态切换 |
| GET | `/admin/agent/list/all` | 全部可用 Agent（下拉选项） | 管理后台 下拉选择 |

### 2.3 Agent 执行 API (`/api/agent`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| POST | `/api/agent/register` | 注册 Agent（含 Graph 编译） | 管理后台 Graph 发布 |
| GET | `/api/agent/{agentId}` | 获取 Agent 运行时定义 | 双端 Agent 详情 |
| POST | `/api/agent/{agentId}` | 更新运行时 Agent | 管理后台 |
| GET/POST | `/api/agent/{agentId}/execute` | 同步执行 Agent | 双端 对话/调试 |
| GET/POST | `/api/agent/{agentId}/executeStream` | SSE 流式执行 Agent | 双端 流式对话 |
| POST | `/api/agent/{agentId}/version/switch` | 切换 Agent 活跃版本 | 管理后台 版本切换 |
| GET | `/api/agent/list` | 获取已注册的 Agent 列表 | 用户前台 Agent 广场 |

### 2.4 Graph 编排 API (`/admin/agent/{agentId}/version/{versionId}/graph`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/graph` | 获取 Graph 配置 | 管理后台 Graph 加载 |
| PUT | `/graph` | 更新 Graph 配置 | 管理后台 Graph 保存 |
| POST | `/graph/validate` | 校验 Graph 配置 | 管理后台 Graph 校验 |
| POST | `/graph/node` | 添加单个节点 | 管理后台 |
| PUT | `/graph/node/{nodeId}` | 更新单个节点 | 管理后台 |
| DELETE | `/graph/node/{nodeId}` | 删除单个节点 | 管理后台 |
| POST | `/graph/edge` | 添加边 | 管理后台 |
| DELETE | `/graph/edge` | 删除边 | 管理后台 |
| GET | `/graph/canvas` | 获取画布布局 | 管理后台 |
| PUT | `/graph/canvas` | 保存画布布局 | 管理后台 |

### 2.5 版本管理 API (`/admin/agent/{agentId}/version`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/version` | 版本列表 | 管理后台 |
| GET | `/version/{versionId}` | 版本详情（含 Graph） | 管理后台 |
| POST | `/version` | 创建版本 | 管理后台 |
| PATCH | `/version/{versionId}` | 更新版本元信息 | 管理后台 |
| DELETE | `/version/{versionId}` | 删除版本 | 管理后台 |
| POST | `/{versionId}/publish` | 发布版本 | 管理后台 |
| POST | `/{versionId}/archive` | 归档版本 | 管理后台 |
| POST | `/{versionId}/activate` | 激活版本 | 管理后台 |
| POST | `/{versionId}/copy` | 复制版本 | 管理后台 |

### 2.6 AI 平台 API (`/ai/platform`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/ai/platform/page` | 平台分页列表 (name, code) | 管理后台 |
| GET | `/ai/platform/enabled` | 已启用平台列表 | 管理后台 |
| GET | `/ai/platform/options` | 平台下拉选项 | 管理后台 ApiSelect |
| GET | `/ai/platform/{id}` | 平台详情 | 管理后台 |
| GET | `/ai/platform/code/{code}` | 按编码查平台 | 管理后台 |
| GET | `/ai/platform/default` | 获取默认平台 | 管理后台 |
| POST | `/ai/platform` | 创建平台 | 管理后台 |
| PATCH | `/ai/platform/{id}` | 更新平台 | 管理后台 |
| DELETE | `/ai/platform/{id}` | 删除平台 | 管理后台 |
| PUT | `/ai/platform/{id}/default` | 设为默认平台 | 管理后台 |
| POST | `/ai/platform/reload` | 刷新适配器 | 管理后台 |

### 2.7 AI 模型 API (`/ai/model`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/ai/model/page` | 模型分页 (platformId) | 管理后台 |
| GET | `/ai/model/platform/{platformId}` | 某平台下模型列表 | 管理后台 |
| GET | `/ai/model/platform/by-code/{platformCode}` | 按平台编码查模型 | 管理后台 |
| GET | `/ai/model/options` | 模型下拉选项 | 管理后台 ApiSelect |
| GET | `/ai/model/{id}` | 模型详情 | 管理后台 |
| GET | `/ai/model/platform/{platformId}/default` | 平台默认模型 | 管理后台 |
| POST | `/ai/model` | 创建模型 | 管理后台 |
| PATCH | `/ai/model/{id}` | 更新模型 | 管理后台 |
| DELETE | `/ai/model/{id}` | 删除模型 | 管理后台 |
| DELETE | `/ai/model/batch` | 批量删除模型 | 管理后台 |
| PUT | `/ai/model/{id}/default` | 设为默认模型 | 管理后台 |

### 2.8 意图定义 API (`/intent/def`)

| 方法 | 端点 | 说明 | 前端用途 |
|------|------|------|---------|
| GET | `/intent/def/page` | 意图分页 (agentId, name, code, category) | 管理后台 |
| GET | `/intent/def/{id}` | 意图详情 | 管理后台 |
| POST | `/intent/def` | 创建意图 | 管理后台 |
| PATCH | `/intent/def/{id}` | 更新意图 | 管理后台 |
| DELETE | `/intent/def/{id}` | 删除意图 | 管理后台 |
| DELETE | `/intent/def/batch` | 批量删除意图 | 管理后台 |
| GET | `/intent/def/options` | 意图下拉选项 | 管理后台 |

### 2.9 认证 API (`/auth`) — 双端共用

| 方法 | 端点 | 说明 | 对应前端 |
|------|------|------|---------|
| POST | `/auth/login` | 用户登录 | 双端登录页 |
| GET | `/auth/codes` | 获取权限码 | 管理后台按钮鉴权 |
| POST | `/auth/refresh` | 刷新 Token | 双端 Token 刷新 |
| POST | `/auth/logout` | 登出 | 双端登出 |
| PATCH | `/auth/current-role` | 切换当前角色 | 管理后台角色切换 |
| POST | `/auth/switch-tenant` | 切换租户 | 管理后台租户切换 |
| POST | `/auth/switch-workspace` | 切换工作空间 | 管理后台空间切换 |
| GET | `/auth/workspaces` | 获取用户工作空间 | 双端 |
| GET | `/auth/tenants` | 获取用户租户列表 | 管理后台 |
| GET | `/auth/captcha` | 获取验证码 | 双端登录页 |
| POST | `/auth/captcha/validate` | 校验验证码 | 双端登录页 |

### 2.10 用户 API (`/user`) — 双端共用

| 方法 | 端点 | 说明 | 对应前端 |
|------|------|------|---------|
| GET | `/user/info` | 当前用户信息 (含租户/空间) | 双端用户中心 |
| GET | `/user?pageNo&pageSize` | 用户分页列表 | 管理后台 |
| POST | `/user` | 创建用户 | 管理后台 |
| PATCH | `/{userId}` | 更新用户 | 管理后台 |
| DELETE | `/{userId}` | 删除用户 | 管理后台 |
| PATCH | `/{userId}/password/reset` | 重置密码 | 管理后台 |
| PATCH | `/{userId}/password` | 修改密码（校验旧密码） | 双端 |

### 2.11 菜单 API (`/menu`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/menu/all` | 全部菜单（含按钮） |
| GET | `/menu/list` | 菜单列表 |
| GET | `/menu/list/roots` | 根级菜单 |
| GET | `/menu/list/children/{parentId}` | 子菜单 |
| GET | `/menu/role/permissions/tree` | 角色权限树 |
| GET | `/menu/menu/tree` | 菜单树 |
| GET | `/menu/tree` | 菜单树 |
| POST | `/menu` | 创建菜单 |
| PATCH | `/{id}` | 更新菜单 |
| DELETE | `/{id}` | 删除菜单 |
| GET | `/menu/name-exists` | 菜单名唯一校验 |
| GET | `/menu/path-exists` | 菜单路径唯一校验 |
| GET | `/menu/button/{parentId}` | 获取按钮级菜单 |

### 2.12 角色 API (`/role`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/role/list` | 角色分页列表 |
| GET | `/role` | 角色列表（所有） |
| POST | `/role` | 创建角色 |
| PATCH | `/{id}` | 更新角色 |
| PUT | `/{id}` | 强制更新角色 |
| DELETE | `/{id}` | 删除角色 |
| PATCH | `/role/users/add/{id}` | 分配用户 |
| PATCH | `/role/users/remove/{id}` | 移除用户 |

### 2.13 工作空间 API (`/workspace`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/workspace/list` | 工作空间列表 |
| POST | `/workspace` | 创建工作空间 |
| PATCH | `/{id}` | 更新工作空间 |
| DELETE | `/{id}` | 删除工作空间 |

### 2.14 租户 API (`/tenant`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/tenant/all` | 全部租户 |
| GET | `/{id}` | 租户详情 |
| POST | `` | 创建租户 |
| PATCH | `/{id}` | 更新租户 |
| DELETE | `/{id}` | 删除租户 |

### 2.15 字典 API (`/dict`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/dict/page` | 字典分页 |
| GET | `/{id}` | 字典详情 |
| GET | `/dict/type/{dictType}` | 按类型查字典 |
| POST | `` | 创建字典 |
| PATCH | `/{id}` | 更新字典 |
| DELETE | `/{id}` | 删除字典 |
| DELETE | `/batch` | 批量删除 |

### 2.16 节点类型 API (`/admin/agent/node-types`) — 仅管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/admin/agent/node-types` | 所有节点类型枚举 |
| GET | `/{nodeType}` | 按类型查节点配置 schema |

### 2.17 日常记录 API (`/api/*`) — 仅管理后台

| 方法 | `/api/profile` | `/api/record` | `/api/timeline` | `/api/media` | `/api/tag` |
|------|---------------|---------------|-----------------|--------------|------------|
| GET page | `/page` | `/page` | `/page?profileId` | `/page` | `/page` |
| GET {id} | `/{id}` | `/{id}` | `/{id}` | `/{id}` | `/{id}` |
| POST | `` | `` | `` | `` | `` |
| PUT | `` | `` | `` | `` | `` |
| DELETE | `/{id}` | `/{id}` | `/{id}` | `/{id}` | `/{id}` |
| 其他 | - | - | `/profile/{profileId}` | - | `/all` |

### 2.18 通用对话 API (`/api/chat`) — 用户前台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/chat/platforms` | 获取可用平台列表 |
| POST | `/api/chat/send` | 同步对话 |
| POST | `/api/chat/send/stream` | SSE 流式对话 |
| POST | `/api/chat/send/with-memory` | 带记忆对话 |
| GET | `/api/chat/default-model` | 获取平台默认模型 |

### 2.19 知识库 API (`/api/v1/knowledge`) — 用户前台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/{id}` | 知识点详情 |
| GET | `` | 知识点列表 |
| GET | `/{id}/graph` | 知识点图谱 |
| GET | `/{id}/path` | 知识点路径 |
| GET | `/{id}/prerequisites` | 前置知识点 |
| GET | `/{id}/prerequisites-list` | 前置知识点列表 |
| GET | `/{id}/subsequent-list` | 后续知识点列表 |
| POST | `` | 创建知识点 |
| PUT | `/{id}` | 更新知识点 |
| DELETE | `/{id}` | 删除知识点 |
| POST | `/relation` | 添加知识点关系 |
| DELETE | `/relation` | 删除知识点关系 |
| POST | `/reload` | 重新加载 |
| GET | `/search` | 搜索知识点 |
| GET | `/search/modes` | 搜索模式列表 |
| POST | `/rebuild-index` | 重建索引 |
| GET | `/rebuild-index/{taskId}` | 重建索引进度 |
| GET | `/rebuild-index` | 索引状态 |
| DELETE | `/index` | 删除索引 |

### 2.20 知识库文档 API (`/api/v1/knowledge/documents`) — 用户前台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/{id}` | 文档详情 |
| GET | `?keyword&topK` | 文档搜索 |
| GET | `/by-knowledge/{knowledgeId}` | 按知识点查文档 |
| POST | `` | 创建文档 |
| PUT | `/{id}` | 更新文档 |
| DELETE | `/{id}` | 删除文档 |

### 2.21 文件上传 API (`/upload`) — 双端共用

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/upload` | 上传文件 (MultipartFile) |

### 2.22 时区 API (`/timezone`) — 管理后台

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/timezone/getTimezoneOptions` | 时区选项 |
| GET | `/timezone/getTimezone` | 当前时区 |
| POST | `/timezone/setTimezone` | 设置时区 |

### 2.23 教育 API (`/api/v1/*`) — 规划预留

| Controller | 基础路径 | 说明 |
|-----------|---------|------|
| SubjectController | `/api/v1/subject` | 学科 CRUD |
| TextbookController | `/api/v1/textbook` | 教材 CRUD |
| ChapterController | `/api/v1/chapter` | 章节 CRUD + 树 |
| CourseController | `/api/v1/course` | 课程 CRUD + 学习 |
| ExamController | `/api/v1/exam` | 考试 CRUD + 提交 |
| QuestionController | `/api/v1/question` | 题库 CRUD |
| StudyPlanController | `/api/v1/plan` | 学习计划 CRUD |
| ReviewController | `/api/v1/review` | 复习任务 CRUD |
| AnalyticsController | `/api/v1/analytics` | 学情分析 |
| ResourceController | `/api/v1/resource` | 资源 CRUD |
| WrongQuestionController | `/api/v1/wrong-question` | 错题 CRUD |

---

## 三、模块设计

### 3.1 模块划分总览

```
shiyu-ui 前端模块 (按后端API边界划分)
├── agent-core          # Agent 核心管理(管理后台) — AgentAdminController
├── agent-graph         # Graph 编排(管理后台) — AgentGraphController
├── agent-version       # 版本管理(管理后台) — AgentVersionController
├── agent-execution     # Agent 执行(管理后台 Modal) — AgentController
├── agent-platform      # AI 平台管理(管理后台) — AiPlatformController
├── agent-model         # AI 模型管理(管理后台) — AiModelController
├── agent-intent        # 意图管理(管理后台) — IntentDefController
├── system-auth         # 认证/用户(双端) — AuthController + UserController
├── system-role         # 角色管理(管理后台) — RoleController
├── system-menu         # 菜单管理(管理后台) — MenuController
├── system-workspace    # 工作空间(管理后台) — WorkspaceController
├── system-tenant       # 租户管理(管理后台) — TenantController
├── system-dict         # 字典管理(管理后台) — DictController
├── system-timezone     # 时区设置(管理后台) — TimezoneController
├── record              # 日常记录(管理后台) — Profile/Record/Timeline/Media/Tag
├── dashboard           # 仪表盘(管理后台)
├── chat-demo           # AI 对话(用户前台) — ChatDemoController
├── ai-knowledge        # 知识库(用户前台) — KnowledgeController + DocumentController
├── file-upload         # 文件上传(双端) — FileController
└── education           # 教育(规划预留)
```

### 3.2 管理后台 (web-naive) 模块详细

| 模块 | 页面 | 控制器 | API 数量 | 状态 |
|------|------|--------|---------|------|
| **AgentCore** | agent-list, agent-edit, agent-form | AgentAdminController | 7 | ✅ |
| **AgentGraph** | agent-edit 内 VueFlow | AgentGraphController | 10 | ✅ |
| **AgentVersion** | agent-edit 内 NCollapse | AgentVersionController | 9 | ✅ |
| **AgentExecution** | chat Modal | AgentController (部分) | 3 | ✅ |
| **AgentPlatform** | platform/list, platform/form | AiPlatformController | 11 | ✅ |
| **AgentModel** | model/list, model/form, chat-dialog | AiModelController | 11 | ✅ |
| **AgentIntent** | intent/list, intent/form | IntentDefController | 7 | ✅ |
| **SystemAuth** | login, user/info | AuthController + UserController | 16 | ✅ |
| **SystemUser** | user/list, user/form | UserController | 6 | ✅ |
| **SystemRole** | role/list, role/form, NTree | RoleController | 8 | ✅ |
| **SystemMenu** | menu/list, menu/form, tree | MenuController | 13 | ✅ |
| **SystemWorkspace** | workspace/list, workspace/form | WorkspaceController | 4 | ✅ |
| **SystemTenant** | tenant/list, tenant/form | TenantController | 5 | ✅ |
| **SystemDict** | dict/list, dict/form | DictController | 7 | ✅ |
| **SystemTimezone** | timezone settings | TimezoneController | 3 | ✅ |
| **RecordProfile** | profile/list, profile/form | ProfileController | 4 | ✅ |
| **RecordTimeline** | timeline/list, timeline/form | TimelineEventController | 5 | ✅ |
| **RecordMedia** | (未独立页面, 关联记录) | MediaController | 4 | ✅ |
| **RecordTag** | (未独立页面, 关联管理) | TagController | 5 | ✅ |
| **Dashboard** | analytics, workspace | - | - | ✅ |

### 3.3 用户前台 (web-client) 模块详细 — 规划中

| 模块 | 页面 | 控制器 | API 数量 | 状态 |
|------|------|--------|---------|------|
| **ChatCore** | `/chat`, `/chat/:sessionId` | ChatDemoController | 5 | 🔧 规划 |
| **AgentSquare** | `/agent`, `/agent/:agentId` | AgentController | 2 | 🔧 规划 |
| **AgentChat** | Agent 详情内对话 | AgentController (execute) | 2 | 🔧 规划 |
| **Knowledge** | `/knowledge`, `/knowledge/search` | KnowledgeController + DocumentController | 18 | 🔧 规划 |
| **UserCenter** | `/space/settings`, `/space/history` | UserController (用户前台子集) | 3 | 🔧 规划 |
| **Auth** | `/login`, `/register` | AuthController (登录子集) | 4 | 🔧 规划 |

### 3.4 双端 API 共享矩阵

```
API 端点                                    web-naive   web-client
─────────────────────────────────────────────────────────────────
/auth/login                                   ✅           ✅
/auth/codes                                   ✅           ❌
/auth/refresh                                 ✅           ✅
/auth/logout                                  ✅           ✅
/auth/workspaces                              ✅           ✅ (只读)
/auth/tenants                                 ✅           ✅ (只读)
/auth/captcha                                 ✅           ✅
/auth/switch-*                                ✅           ❌
/user/info                                    ✅           ✅
/user/{userId}/password                       ✅           ✅
/api/agent/{agentId}                          ✅           ✅
/api/agent/{agentId}/execute                  ✅           ✅
/api/agent/{agentId}/executeStream            ✅           ✅
/api/agent/list                               ❌           ✅
/api/chat/*                                   ❌           ✅
/api/v1/knowledge/*                           ❌           ✅
/api/v1/knowledge/documents/*                 ❌           ✅
/upload                                       ✅           ✅
```

---

## 四、路由系统

### 4.1 管理后台路由 (web-naive) — 后端动态路由模式

后端 DB `menu` 表定义的菜单路径：

| path | component | 说明 | 可见性 |
|------|-----------|------|--------|
| `/dashboard` | BasicLayout (目录) | 仪表盘分组 | visible |
| `/analytics` | `/dashboard/analytics/index` | 分析页 | visible |
| `/workspace` | `/dashboard/workspace/index` | 工作空间 | visible |
| `/system` | BasicLayout (目录) | 系统管理分组 | visible |
| `/system/user` | `/system/user/list` | 用户管理 | visible |
| `/system/role` | `/system/role/list` | 角色管理 | visible |
| `/system/menu` | `/system/menu/list` | 菜单管理 | visible |
| `/system/workspace` | `/system/workspace/list` | 工作空间管理 | visible |
| `/system/tenant` | `/system/tenant/list` | 租户管理 | visible |
| `/system/dict` | `/common/dict/list` | 字典管理 | visible |
| `/record` | (目录) | 日常记录分组 | visible |
| `/record/profile` | `/record/profile/list` | 人物管理 | visible |
| `/record/timeline` | `/record/timeline/list` | 时间轴管理 | visible |
| `/agent` | (目录) | 智能体分组 | visible |
| `/agent/admin/list` | `/agent/admin/agent-list` | Agent管理 | visible |
| `/agent/admin/edit` | `/agent/admin/agent-edit` | 编辑页 | hidden |
| `/agent/platform` | `/agent/platform/list` | 平台管理 | visible |
| `/agent/model` | `/agent/model/list` | 模型管理 | visible |
| `/agent/intent` | `/agent/intent/list` | 意图管理 | visible |

### 4.2 用户前台路由 (web-client) — 静态路由

```typescript
const routes = [
  // 认证
  { path: '/login', component: Login },
  
  // AI 对话 (核心)
  { path: '/chat', component: ChatIndex, meta: { requiresAuth: true } },
  { path: '/chat/:sessionId', component: ChatIndex, meta: { requiresAuth: true } },
  
  // Agent 广场
  { path: '/agent', component: AgentSquare, meta: { requiresAuth: true } },
  { path: '/agent/:agentId', component: AgentDetail, meta: { requiresAuth: true } },
  
  // 知识库
  { path: '/knowledge', component: KnowledgeIndex, meta: { requiresAuth: true } },
  { path: '/knowledge/:id', component: KnowledgeDetail, meta: { requiresAuth: true } },
  { path: '/knowledge/search', component: KnowledgeSearch, meta: { requiresAuth: true } },
  
  // 个人空间
  { path: '/space', redirect: '/space/settings' },
  { path: '/space/settings', component: SpaceSettings, meta: { requiresAuth: true } },
  { path: '/space/history', component: ChatHistory, meta: { requiresAuth: true } },
];
```

---

## 五、数据库核心表结构

### 5.1 Agent 相关表 (agent 数据源)

```sql
ai_platform (id, name, code, base_url, api_key, temperature, 
             max_tokens, available_models, is_default, status)

ai_model (id, platform_id, model_name, display_name, 
          is_default, status, sort)

agent_def (id, agent_id, name, description, status)

agent_version (id, agent_id, version_number, description, 
              status DRAFT|PUBLISHED|ARCHIVED, graph_config TEXT)

intent_def (id, agent_id, code, name, category, 
           priority, target_node, enabled)
```

### 5.2 权限相关表 (auth 数据源)

```sql
tenant (id, code, name, status)
user (id, username, password, tenant_id, status, ext_info)
role (id, code, name, tenant_id, status)
menu (id, name, code, type CATALOG|MENU|BUTTON, parent_id, 
      path, component, icon, show, layout, keep_alive, method, order, status)
user_workspace_role (user_id, workspace_id, role_id, tenant_id)  -- PK
role_workspace_menu (role_id, workspace_id, menu_id, tenant_id)  -- PK
workspace (id, parent_id, name, tenant_id, leader, status)
```

### 5.3 日常记录表 (record 数据源)

```sql
profile (id, name, gender, avatar, address, email, ...)
record (id, profile_id, event_id, content, ...)
timeline_event (id, profile_id, event_date, title, description, ...)
media (id, record_id, type, url, ...)
tag (id, name, color, ...)
record_tag (record_id, tag_id)
```

### 5.4 教育/知识库表 (预留)

```sql
-- 教育域 (education 数据源)
subject, textbook, chapter, course, exam, question, study_plan, 
review_task, resource, wrong_question, study_record

-- 知识库 (knowledge 数据源)
knowledge (id, name, description, subject, grade_level, ...)
document (id, knowledge_id, title, content, source, ...)
knowledge_relation (source_id, target_id, type, weight)
```

---

## 六、系统架构图

### 6.1 完整双应用架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                         shiyu-ui (前端)                                │
│                                                                      │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐  │
│  │     管理后台 web-naive (5888)     │  │  用户前台 web-client (5889) │  │
│  │                                 │  │                           │  │
│  │  Vue 3 + Vben Admin 5.x        │  │  Vue 3 (无 Vben 框架)     │  │
│  │  + Naive UI + VxeTable          │  │  + Naive UI (按需)        │  │
│  │  + VueFlow (Graph编排)           │  │  + 流式对话核心            │  │
│  │                                 │  │                           │  │
│  │  Agent管理  │ 系统管理 │ 记录    │  │  AI对话 │ Agent广场       │  │
│  │  Graph编排  │ 平台/模型 │ 意图   │  │  知识库  │ 个人空间        │  │
│  │  仪表盘     │ 字典/时区          │  │                           │  │
│  └──────────┬──────────────────────┘  └──────────┬────────────────┘  │
│             │                                     │                   │
│             └──────────────┬──────────────────────┘                   │
│                            │                                         │
│              ┌─────────────┴─────────────┐                           │
│              │    共享层 (packages/)       │                           │
│              │  effects/request (SSE工具)  │                           │
│              │  stores (useAccessStore)    │                           │
│              │  utils / types / hooks      │                           │
│              └─────────────────────────────┘                           │
└──────────────────────────────────┬────────────────────────────────────┘
                                   │ HTTP / SSE / JSON
┌──────────────────────────────────┴────────────────────────────────────┐
│                         shiyu-ai (后端)                                │
│                                                                      │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │shiyu-ai-agent│ │shiyu-ai-auth │ │shiyu-ai-   │ │shiyu-ai-     │  │
│  │ Agent核心    │ │ 认证授权     │ │record 记录 │ │knowledge 知识│  │
│  │ :9000       │ │ :9002        │ │ :9005      │ │ :9006        │  │
│  ├─ /admin/agent│ ├─ /auth       │ ├─ /api/     │ ├─ /api/v1/    │  │
│  ├─ /api/agent  │ ├─ /user       │ │  profile   │ │  knowledge   │  │
│  ├─ /ai/platform│ ├─ /role       │ ├─ /api/     │ └──────────────┘  │
│  ├─ /ai/model   │ ├─ /menu       │ │  timeline  │ ┌──────────────┐  │
│  ├─ /intent/def │ ├─ /workspace  │ ├─ /api/     │ │shiyu-ai-     │  │
│  └─────────────┘ ├─ /tenant      │ │  media     │ │education 教育 │  │
│  ┌─────────────┐ ├─ /dict        │ ├─ /api/     │ │ :9007 (预留)  │  │
│  │shiyu-ai-core │ ├─ /timezone   │ │  tag       │ └──────────────┘  │
│  │ 对话引擎     │ └──────────────┘ │  /api/     │                    │
│  │ :9001        │                  │  record    │                    │
│  ├─ /api/chat   │                  └────────────┘                    │
│  └─────────────┘                                                     │
│              Sa-Token + JWT + MyBatis-Flex + H2/MySQL                │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 数据流

```
管理后台操作流:
  管理员 → web-naive 组件 → requestClient → /admin/agent (带 SaToken 鉴权)
  → AgentAdminController → AgentAdminService → Repository → DB
  → 返回 Result<code=200> → 前端渲染表格/卡片

用户前台对话流:
  用户 → web-client 组件 → fetch (SSE) → /api/agent/{id}/executeStream
  → AgentController → AgentService (Graph 编译 → 执行)
  → Flux<NodeOutput> → SSE stream → ReadableStream → 实时渲染

用户前台知识库搜索流:
  用户 → web-client 组件 → requestClient → /api/v1/knowledge/search
  → KnowledgeController → KnowledgeService → 向量检索 + 全文搜索
  → Result<List<KnowledgeResponse>> → 前端展示结果列表
```

---

## 七、权限体系

### 7.1 管理后台 — 三级 RBAC

```
租户 (Tenant) — MyBatis-Flex 多租户自动隔离
  └── 工作空间 (Workspace) — tenant_workspace_helper 业务过滤
       └── 角色 (Role) — role_workspace_menu 绑定菜单权限
            └── 用户 (User) — user_workspace_role 分配角色
```

- **权限码**: `system:user:query`, `common:platform:create` 等
- **按钮级**: `<Auth :value="'system:user:query'">` 指令
- **菜单级**: 后端返回按角色过滤的菜单树

### 7.2 用户前台 — 轻量鉴权

- **登录校验**: 路由守卫 `router.beforeEach` → `useAccessStore().accessToken`
- **无按钮级权限**: 仅有登录/未登录区分
- **接口鉴权**: 由后端 API 层 (Sa-Token) 统一控制

---

## 八、前端-后端对接规范

### 8.1 请求规范

```typescript
// web-naive (Vben Admin)
import { requestClient } from '#/api/request';
// 自动注入 Bearer Token, Content-Type
// 自动拦截 code=200 解 data, code!=200 弹 message
// 自动 401 → 跳转登录 / 弹出 Modal

// web-client (轻量，可复用同一 requestClient)
import { requestClient } from '@vben/effects/request';
// 同上，共享 token 管理
```

### 8.2 SSE 规范 (双端共用)

```typescript
// 统一封装在 packages/effects/request/src/sse.ts
createSseStream({ url, body, onMessage, onError, onDone }) → AbortController
// 1. 原生 fetch (requestClient 不支持 SSE)
// 2. 手动注入 Bearer Token (fetch 绕过拦截器)
// 3. 跨 chunk 缓冲合并 (buffer + lines.pop())
// 4. 解析 data: { code: 200, data: { content: "..." } }
// 5. AbortController 支持取消
```

### 8.3 枚举字段规范

```
后端 DO (Integer code) → BO (Integer code + String label) → VO
前端 API 类型: { gender?: number, genderLabel?: string }
表单提交 code, 列表展示 label
后端 Repository 填充 label (单一责任)
```

---

## 九、开发进度

### 9.1 当前状态

```
管理后台 (web-naive): ✅ 90% 完成
用户前台 (web-client): 🔧 0% (规划中)
API 覆盖: 管理后台 156/156 端点, 用户前台 22/44 端点 (部分)
```

### 9.2 管理后台完成度

| 模块 | API 端点 | 页面 | 状态 |
|------|---------|------|------|
| Agent 管理 | 7 | agent-list, agent-edit, agent-form | ✅ |
| Graph 编排 | 10 | agent-edit (VueFlow) | ✅ |
| 版本管理 | 9 | agent-edit (NCollapse) | ✅ |
| Agent 执行 | 3 | chat Modal | ✅ |
| 平台管理 | 11 | platform/list + form | ✅ |
| 模型管理 | 11 | model/list + form + chat-dialog | ✅ |
| 意图管理 | 7 | intent/list + form | ✅ |
| 认证/用户 | 16 | login + user/list | ✅ |
| 角色管理 | 8 | role/list + form + NTree | ✅ |
| 菜单管理 | 13 | menu/list + form + 树 | ✅ |
| 工作空间 | 4 | workspace/list + form | ✅ |
| 租户管理 | 5 | tenant/list + form | ✅ |
| 字典管理 | 7 | dict/list + form | ✅ |
| 日常记录 | 18 | profile/timeline/media/tag | ✅ |
| 仪表盘 | - | analytics + workspace | ✅ |

### 9.3 用户前台开发规划

| 阶段 | 模块 | API 端点 | 页面 | 优先级 |
|------|------|---------|------|--------|
| P0 | 登录/认证 | 4 | login | 🔴 |
| P0 | AI 对话 | 5 | /chat, /chat/:sessionId | 🔴 |
| P1 | Agent 广场 | 2 | /agent, /agent/:agentId | 🟡 |
| P1 | 个人空间 | 3 | /space/settings, /space/history | 🟡 |
| P2 | 知识库 | 18 | /knowledge, /search | 🟢 |

### 9.4 版本计划

| 版本 | 日期 | 内容 |
|------|------|------|
| v1.0 | 2026-06 | 管理后台完整发布 |
| v2.0 | TBD | web-client 基础 + AI 对话 |
| v2.1 | TBD | Agent 广场 + 个人空间 |
| v2.2 | TBD | 知识库 + RAG 对话 |

