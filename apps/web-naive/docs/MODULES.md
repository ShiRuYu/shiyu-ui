# MODULES.md — 业务模块文档

## 一、模块总览

| 模块 | 路由前缀 | 文件数 | 说明 |
| --- | --- | :-: | --- |
| `agent` | `/agent` | 17 | Agent 管理（管理、模型、平台、意图） |
| `ai-tutor` | `/ai-tutor` | 5 | AI 家教（聊天、规划、练习、报告） |
| `analytics` | `/analytics` | 4 | 数据分析 |
| `dashboard` | `/dashboard` | 7 | 仪表盘 |
| `education-admin` | `/education-admin` | 34 | 教育管理后台 |
| `exam` | `/exam` | 4 | 考试模块 |
| `knowledge-engine` | `/knowledge-engine` | 9 | 知识引擎 |
| `learning` | `/learning` | 10 | 学习模块 |
| `practice` | `/practice` | 2 | 练习模块 |
| `record` | `/record` | 15 | 成长记录 |
| `review` | `/review` | 2 | 复习 |
| `system` | `/system` | 21 | 系统管理 |
| `_core` | `/` | 14 | 核心页面（登录/注册/个人信息） |

---

## 二、模块详情

### 2.1 Agent 模块 `views/agent/`

```
agent/
├── admin/                    # Agent 管理
│   ├── agent-list.vue        # Agent 列表页 (229 行)
│   ├── agent-edit.vue        # Agent 编辑页 (1219 行) ⚠️ 需要拆分
│   ├── data.ts               # 类型定义
│   └── modules/
│       ├── node-form.vue     # 节点表单组件
│       └── validate-result.vue # 验证结果组件
├── agent/                    # Agent 执行
│   └── modules/
│       └── chat.vue          # 聊天组件
├── chat-config/              # 聊天配置
│   └── index.vue
├── intent/                   # 意图管理
│   ├── list.vue
│   ├── data.ts
│   └── modules/
│       └── form.vue
├── model/                    # 模型管理
│   ├── list.vue
│   ├── data.ts
│   └── modules/
│       ├── form.vue
│       └── chat-dialog.vue
└── platform/                 # 平台管理
    ├── list.vue
    ├── data.ts
    └── modules/
        └── form.vue
```

**接口文件** (`api/agent/`):

- `admin.ts` — Agent CRUD
- `agent.ts` — Agent 执行（同步/流式）
- `chat.ts` — 聊天接口
- `graph.ts` — 图配置
- `model.ts` — 模型选项
- `node-type.ts` — 节点类型
- `platform.ts` — 平台配置
- `version.ts` — 版本管理
- `intent-def.ts` — 意图定义
- `tutor-agent.ts` — 家教 Agent

---

### 2.2 知识引擎模块 `views/knowledge-engine/`

```
knowledge-engine/
├── document/                 # 文档管理
│   ├── list.vue
│   ├── data.ts
│   └── modules/
│       └── form.vue
├── index-rebuild/           # 索引重建
│   └── list.vue
├── knowledge-graph/         # 知识图谱
│   └── index.vue
├── knowledge-list/          # 知识库列表
│   ├── list.vue
│   ├── data.ts
│   └── modules/
│       └── form.vue
└── knowledge-relation/      # 知识关系
    └── index.vue
```

**接口文件** (`api/knowledge/`):

- `knowledge.ts` — 知识库
- `document.ts` — 文档
- `relation.ts` — 关系
- `index-rebuild.ts` — 索引重建

> ⚠️ **建议重构**：随着 Chunk、Embedding、Search、Workflow、Version 等功能加入，建议按子域拆分：
>
> ```
> knowledge/
> ├── document/
> ├── chunk/
> ├── index/
> ├── search/
> ├── workflow/
> └── version/
> ```

---

### 2.3 教育管理模块 `views/education-admin/`

```
education-admin/
├── analytics/               # 数据分析
├── chapter/                 # 章节管理 (data/list/form)
├── course-admin/            # 课程管理 (data/list/form)
├── exam-admin/              # 考试管理 (data/list/form)
├── plan/                    # 学习计划 (data/list/form)
├── question-admin/          # 题库管理 (data/list/form)
├── resource-admin/          # 资源管理 (data/list/form)
├── review/                  # 审核管理 (data/list/form)
├── student/                 # 学生管理 (data/list/form)
├── subject/                 # 科目管理 (data/list/form)
├── textbook/                # 教材管理 (data/list/form)
└── wrong-question/          # 错题管理 (data/list/form)
```

**每个子模块统一结构**：

```
xxx/
├── list.vue        → 列表页（NDataTable + 搜索 + CRUD）
├── data.ts         → 类型定义 + 列配置 + 搜索表单 schema
└── modules/
    └── form.vue    → 增改表单弹窗
```

---

### 2.4 系统管理模块 `views/system/`

```
system/
├── auth-code/              # 授权码
├── dict/                   # 数据字典
├── menu/                   # 菜单管理
├── role/                   # 角色管理
├── tenant/                 # 租户管理
├── upload/                 # 上传管理
├── user/                   # 用户管理
└── tenant/                 # 租户与子租户范围
```

每个子模块同样采用 `data.ts + list.vue + modules/form.vue` 结构。

---

### 2.5 学习模块 `views/learning/`

```
learning/
├── course/
│   ├── list.vue        (148 行)
│   ├── detail.vue      (101 行)
│   └── learn.vue       (344 行) ⚠️ 较重
├── knowledge/
│   ├── list.vue        (105 行)
│   └── detail.vue      (172 行)
├── plan/
│   ├── list.vue        (175 行)
│   └── detail.vue      (104 行)
└── resource/
    └── list.vue        (111 行)
```

### 2.6 成长记录模块 `views/record/`

```
record/
├── media/               # 媒体记录
├── profile/             # 个人档案
├── records/             # 成长记录
├── tags/                # 标签管理
└── timeline/            # 时间线
```

### 2.7 其他模块

| 模块 | 说明 |
| --- | --- |
| `dashboard/analytics/` | 数据分析仪表盘 |
| `dashboard/overview/` | AI 平台概览 |
| `ai-tutor/` | AI 家教：chat / planner / practice / report-gen / teacher |
| `exam/` | 考试：ai-exam / exam-list |
| `practice/` | 练习：question / wrong-question |
| `review/` | 复习：today / history |
| `file/` | 文件管理 |

---

## 三、模块通用模式

每个 CRUD 模块遵循统一结构：

```
模块/
├── list.vue         → 主页面（Page + NDataTable + 搜索表单）
├── data.ts          → 类型定义（DataTableColumn + FormSchema + API 接口）
└── modules/
    └── form.vue     → 新增/编辑表单（NModal + NForm）
```

### 标准 CRUD 流程

```
搜索 → 调 API 获取列表 → 渲染 NDataTable
  │
  ├── 新增 → 打开弹窗 → 填写表单 → 提交 → 刷新列表
  ├── 编辑 → 打开弹窗（回填） → 修改 → 提交 → 刷新列表
  └── 删除 → NPopconfirm 确认 → 调删除接口 → 刷新列表
```
