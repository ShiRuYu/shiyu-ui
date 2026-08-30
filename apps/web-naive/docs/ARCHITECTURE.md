# ARCHITECTURE.md

## 架构总览

shiyu-ui 是基于 Vben Admin v5.7 的 AI 教育平台前端，采用 **分层架构** + **领域模块化** 的设计模式。

## 应用初始化流程

```
main.ts
  └─ initApplication()
       ├─ initPreferences()         # 偏好设置初始化
       └─ bootstrap()
            ├─ initComponentAdapter()  # Naive UI 适配
            ├─ initSetupVbenForm()     # 表单组件初始化
            ├─ createApp(App)
            ├─ registerLoadingDirective()
            ├─ setupI18n()             # 国际化
            ├─ initStores()            # Pinia Store
            ├─ registerAccessDirective()
            ├─ app.use(router)         # 路由
            └─ app.mount("#app")
```

## 分层架构

```
┌─────────────────────────────────────────────┐
│                  Views                        │  页面视图层
│  agent/ knowledge/ system/ education-admin/  │
├─────────────────────────────────────────────┤
│               Composables                     │  逻辑复用层
│  useCrudFormModal / useDeleteConfirm / ...    │
├─────────────────────────────────────────────┤
│               Store (Pinia)                   │  状态管理层
│  auth / (chat / agent / knowledge)            │
├─────────────────────────────────────────────┤
│              API Layer                        │  接口请求层
│  agent/ / knowledge/ / system/ / education/  │
├─────────────────────────────────────────────┤
│             Router + Guards                   │  路由控制层
│  core routes / dynamic routes / access guard │
└─────────────────────────────────────────────┘
```

## 目录结构详解

```
src/
├── main.ts                    # 入口，调用 initApplication()
├── bootstrap.ts               # 应用引导：注册插件、组件、路由、挂载
├── app.vue                    # 根组件（Vben App 容器）
├── preferences.ts             # 全局偏好配置（主题、布局模式等）
│
├── adapter/                   # UI 适配层
│   ├── naive.ts               # Naive UI 消息/通知/对话框适配
│   ├── form.ts                # Vben Form 与 Naive UI 适配
│   ├── vxe-table.ts           # Vxe Table 适配
│   └── component/             # 组件适配器
│
├── api/                       # 接口请求层 ────────── 详请见 API.md
│   ├── index.ts               # 统一导出
│   ├── request.ts             # 请求客户端（axios）
│   ├── types.ts               # 通用类型
│   ├── agent/                 # Agent 模块接口
│   ├── core/                  # 核心接口（认证、菜单、用户）
│   ├── dashboard/             # 仪表盘接口
│   ├── education/             # 教育模块接口
│   ├── education-admin/       # 教育管理后台接口
│   ├── knowledge/             # 知识库接口
│   ├── common/                # 通用接口
│   └── system/                # 系统管理接口
│
├── composables/               # 组合式函数 ───────── 详请见 COMPOSABLES.md
│   ├── useCrudFormModal.ts    # CRUD 表单弹窗
│   ├── useDeleteConfirm.ts    # 删除确认
│   └── useCurrentStudentId.ts # 当前学生 ID
│
├── layouts/                   # 布局组件
│   ├── index.ts               # 布局注册
│   ├── auth.vue               # 认证布局（登录/注册）
│   └── basic.vue              # 基础布局（侧边栏 + 顶栏 + 内容区）
│
├── locales/                   # 国际化 ──────────── 详请见 I18N 文档
│   ├── index.ts               # 配置
│   ├── langs/zh-CN/           # 中文语言包
│   └── langs/en-US/           # 英文语言包
│
├── router/                    # 路由系统 ────────── 详请见 ROUTER.md
│   ├── index.ts               # 路由初始化
│   ├── guard.ts               # 路由守卫（权限校验）
│   ├── access.ts              # 权限管理
│   └── routes/
│       ├── core.ts            # 核心路由（登录、根路由、404）
│       ├── modules/           # 动态模块路由
│       └── static/            # 静态后备路由
│
├── store/                     # 状态管理 ────────── 详请见 STATE-MANAGEMENT.md
│   └── auth.ts                # 认证 Store（用户/登录/登出）
│
└── features/                  # 领域 Feature Slice 页面 ── 详请见 MODULES.md
    ├── agent/                 # Agent 管理
    ├── ai-tutor/              # AI 家教
    ├── analytics/             # 数据分析
    ├── common/                # 通用页面
    ├── dashboard/             # 仪表盘
    ├── demos/                 # 示例页面
    ├── education-admin/       # 教育管理
    ├── exam/                  # 考试
    ├── file/                  # 文件管理
    ├── knowledge/             # 企业知识平台
    ├── learning/              # 学习
    ├── practice/              # 练习
    ├── review/                # 复习
    ├── system/                # 系统设置
    └── _core/                 # 核心页面（登录、个人信息、404）
```

## 数据流

```
页面操作
  │
  ▼
API 请求 ─── request.ts (axios)
  │              │
  │              └─ 拦截器：Token注入 / 错误处理
  ▼
后端服务
  │
  ▼
响应
  │
  ├── Store (Pinia) ─── 缓存、共享状态
  │
  └── 页面本地状态 (ref/reactive)
         │
         └── 视图更新
```

## AI 特有数据流

```
用户输入
  │
  ▼
chat / executeAgent API
  │
  ├── 同步请求 → requestClient.post() → 响应
  │
  └── 流式请求 → fetch() + ReadableStream
                    │
                    ├── onMessage() ── 逐步更新 UI
                    └── 完成后更新 Store
```
