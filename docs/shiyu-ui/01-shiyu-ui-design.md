# shiyu-ui 设计文档 — 后端管理功能全规划

> **版本**: 3.0.0  
> **管理后台**: `apps/web-naive`（Vben Admin 5.x + Naive UI）  
> **后端全貌**: 38 个 Controller / 280+ API 端点 / 6 个业务模块  
> **前端现状**: 已完成 28 页（对应 20 个模块），待建 18 页（对应 16 个模块）  
> **最后更新**: 2026-07-02

---

## 第一部分：全貌总览

### 1.1 后端模块一览

```
shiyu-ai 后端                 Port    Controllers    API数    状态
────────────────────────────────────────────────────────────────
shiyu-ai-agent  Agent核心     9000        8          72      ✅
shiyu-ai-auth    认证授权     9002       10          75      ✅
shiyu-ai-record  日常记录     9005        5          32      ✅
shiyu-ai-knowledge 知识库    9006        2          27      ✅
shiyu-ai-education 教育      9007       11          79      ✅
shiyu-ai-core    对话引擎     9001        1           6      ✅
shiyu-common-web 文件服务       —         1           2      ✅
────────────────────────────────────────────────────────────────
合计                           —        38         293     ✅ 全部实现
```

### 1.2 管理后台菜单结构（完整版）

```
一级目录           二级页面                             后端 Controller                   前端状态
──────────────────────────────────────────────────────────────────────────────────────────
仪表盘
├─ 分析页           /dashboard/analytics                —                                ✅
└─ 工作空间         /dashboard/workspace                —                                ✅

系统管理
├─ 用户管理         /system/user                        UserController                   ✅
├─ 角色管理         /system/role                        RoleController                    ✅
├─ 菜单管理         /system/menu                        MenuController                    ✅
├─ 工作空间管理     /system/workspace                   WorkspaceController               ✅
├─ 租户管理         /system/tenant                      TenantController                  ✅
├─ 字典管理         /system/dict                        DictController                    ✅
└─ 时区设置         /system/timezone                    TimezoneController                ✅

智能体
├─ Agent 管理       /agent/admin/list                   AgentAdminController              ✅
│  ├─ Agent 编辑    /agent/admin/edit                   AgentGraphController              ✅
│  │                                                    AgentVersionController            ✅
│  │                                                    NodeTypeController                ✅
│  └─ 执行对话      (Modal)                             AgentController                   ✅
├─ 平台管理         /agent/platform                     AiPlatformController              ✅
├─ 模型管理         /agent/model                        AiModelController                 ✅
├─ 意图管理         /agent/intent                       IntentDefController               ✅
└─ 对话调试         /agent/chat-config                  ChatDemoController                🔧

日常记录
├─ 人物管理         /record/profile                     ProfileController                 ✅
├─ 时间轴管理       /record/timeline                    TimelineEventController           ✅
├─ 记录管理         /record/records                     RecordController                  ✅
├─ 媒体管理         /record/media                       MediaController                   ✅
└─ 标签管理         /record/tags                        TagController                     ✅

知识库管理                                                  KnowledgeController            ❌
├─ 知识点管理       /knowledge/list                                                     ❌
├─ 知识关系         /knowledge/relation                                                 ❌
├─ 知识图谱         /knowledge/graph                                                    ❌
├─ 文档管理         /knowledge/document                 DocumentController               ❌
└─ 索引管理         /knowledge/index                    KnowledgeController              ❌

教育管理                                                   11个Controller                 ❌
├─ 学科管理         /education/subject                  SubjectController                ❌
├─ 教材管理         /education/textbook                 TextbookController               ❌
├─ 章节管理         /education/chapter                  ChapterController                ❌
├─ 课程管理         /education/course                   CourseController                 ❌
├─ 试卷管理         /education/exam                     ExamController                   ❌
├─ 题库管理         /education/question                 QuestionController               ❌
├─ 学习计划         /education/plan                     StudyPlanController              ❌
├─ 复习任务         /education/review                   ReviewController                 ❌
├─ 学情分析         /education/analytics                AnalyticsController              ❌
├─ 资源管理         /education/resource                 ResourceController               ❌
└─ 错题管理         /education/wrong-question           WrongQuestionController          ❌

文件管理
└─ 文件管理         /file                               FileController                   🔧
```

---

## 第二部分：已有功能详细清单（28页 / 20模块 / ✅ 已完成）

### 2.1 智能体模块（视角:views/agent/、API:api/agent/ + api/common/）

| 页面 | 视图文件 | API 文件 | 后端 Controller | 功能说明 |
|------|---------|---------|----------------|---------|
| Agent列表 | `agent/admin/agent-list.vue` | `agent/admin.ts` | AgentAdminController | 卡片布局，分页列表，状态开关，编辑/对话入口 |
| Agent编辑 | `agent/admin/agent-edit.vue` | `agent/graph.ts`, `agent/version.ts` | AgentGraphController, AgentVersionController | 3模式(编辑/只读/新增)，Graph编排(VueFlow)，版本管理(NCollapse) |
| 基本信息表单 | `agent/admin/agent-form.vue` | `agent/admin.ts` | AgentAdminController | Agent基础信息表单（名称/描述/状态） |
| 节点编辑弹窗 | `agent/admin/modules/node-form.vue` | `agent/node-type.ts` | NodeTypeController | 节点配置表单（11字段） |
| 校验结果弹窗 | `agent/admin/modules/validate-result.vue` | `agent/graph.ts` | AgentGraphController | Graph校验结果展示 |
| Agent对话Modal | `agent/agent/modules/chat.vue` | `agent/agent.ts` | AgentController (execute) | 同步/流式切换，SSE流式对话 |
| 平台列表 | `agent/platform/list.vue` | `common/platform.ts` | AiPlatformController | 表格CRUD，设为默认，刷新适配器 |
| 平台表单 | `agent/platform/modules/form.vue` | `common/platform.ts` | AiPlatformController | 新建/编辑弹窗 |
| 模型列表 | `agent/model/list.vue` | `common/model.ts` | AiModelController | 表格CRUD，关联平台，批量删除 |
| 模型表单 | `agent/model/modules/form.vue` | `common/model.ts` | AiModelController | 新建/编辑弹窗 |
| LLM对话弹窗 | `agent/model/modules/chat-dialog.vue` | `agent/chat.ts` | ChatDemoController(间接) | 选平台+模型，SSE流式对话 |
| 意图列表 | `agent/intent/list.vue` | `agent/intent-def.ts` | IntentDefController | 分页CRUD，批量删除 |
| 意图表单 | `agent/intent/modules/form.vue` | `agent/intent-def.ts` | IntentDefController | 编辑弹窗（code/name/category/priority/targetNode） |

### 2.2 系统管理模块（视角:views/system/、API:api/system/ + api/core/）

| 页面 | 视图文件 | API 文件 | 后端 Controller | 说明 |
|------|---------|---------|----------------|------|
| 用户列表 | `system/user/list.vue` | `system/user.ts` | UserController | 分页CRUD，所属角色 |
| 用户表单 | `system/user/modules/form.vue` | `system/user.ts` | UserController | 新建/编辑弹窗 |
| 角色列表 | `system/role/list.vue` | `system/role.ts` | RoleController | 分页CRUD |
| 角色表单(NTree) | `system/role/modules/form.vue` | `system/role.ts` | RoleController | 菜单权限回显(NTree)，用户分配 |
| 菜单列表 | `system/menu/list.vue` | `system/menu.ts`, `core/menu.ts` | MenuController | 树形CRUD |
| 菜单表单 | `system/menu/modules/form.vue` | `system/menu.ts` | MenuController | 新建/编辑弹窗 |
| 工作空间列表 | `system/workspace/list.vue` | `system/workspace.ts` | WorkspaceController | 树形CRUD |
| 工作空间表单 | `system/workspace/modules/form.vue` | `system/workspace.ts` | WorkspaceController | 新建/编辑弹窗 |
| 租户列表 | `system/tenant/list.vue` | `system/tenant.ts` | TenantController | 分页CRUD |
| 租户表单 | `system/tenant/modules/form.vue` | `system/tenant.ts` | TenantController | 新建/编辑弹窗 |
| 字典列表 | `common/dict/list.vue` | `common/dict.ts` | DictController | 分页CRUD |
| 字典表单 | `common/dict/modules/form.vue` | `common/dict.ts` | DictController | 新建/编辑弹窗 |
| 时区设置 | `_core/profile/` | `common/timezone.ts` | TimezoneController | 个人时区选择 |

### 2.3 日常记录模块（视角:views/record/、API:api/record/）

| 页面 | 视图文件 | API 文件 | 后端 Controller | 说明 |
|------|---------|---------|----------------|------|
| 人物列表 | `record/profile/list.vue` | `record/profile.ts` | ProfileController | 分页CRUD |
| 人物表单 | `record/profile/modules/form.vue` | `record/profile.ts` | ProfileController | 新建/编辑弹窗 |
| 时间轴列表 | `record/timeline/list.vue` | `record/timeline.ts` | TimelineEventController | 按人物分页CRUD |
| 时间轴表单 | `record/timeline/modules/form.vue` | `record/timeline.ts` | TimelineEventController | 新建/编辑弹窗 |
| 记录列表 | `record/records/list.vue` | `record/records.ts` | RecordController | 分页CRUD |
| 记录表单 | `record/records/modules/form.vue` | `record/records.ts` | RecordController | 新建/编辑弹窗 |
| 媒体列表 | `record/media/list.vue` | `record/media.ts` | MediaController | 分页CRUD |
| 媒体表单 | `record/media/modules/form.vue` | `record/media.ts` | MediaController | 新建/编辑弹窗 |
| 标签列表 | `record/tags/list.vue` | `record/tag.ts` | TagController | 分页CRUD |
| 标签表单 | `record/tags/modules/form.vue` | `record/tag.ts` | TagController | 新建/编辑弹窗 |

### 2.4 仪表盘 + 认证

| 页面 | 视图文件 | API 文件 | 说明 |
|------|---------|---------|------|
| 分析页 | `dashboard/analytics/index.vue` | — | ECharts 图表 |
| 工作空间 | `dashboard/workspace/index.vue` | — | 卡片布局 |
| 登录 | `_core/authentication/login.vue` | `core/auth.ts`, `core/captcha.ts` | JWT + 验证码 |

---

## 第三部分：缺失功能详细清单（18页 / 16模块 / ❌ 待建）

### 3.1 知识库管理（5页 / 2 Controller / 🔴 P0）

| 页面 | 路径 | 后端 Controller | API 数 | 说明 |
|------|------|----------------|:-----:|------|
| 知识点列表 | `views/knowledge/list.vue` | KnowledgeController | 6 | CRUD + 搜索 |
| 知识关系 | `views/knowledge/relation.vue` | KnowledgeController | 2 | 添加/删除前置/后续/相关关系 |
| 知识图谱 | `views/knowledge/graph.vue` | KnowledgeController | 2 | 知识图谱可视化（D3.js/ECharts） |
| 文档列表 | `views/knowledge/document/list.vue` | DocumentController | 6 | CRUD + 搜索 + 关联知识点 |
| 索引管理 | `views/knowledge/index.vue` | KnowledgeController | 4 | 重建索引、查看进度、索引状态 |

**需新建 API 文件：**
- `api/knowledge/index.ts` — 19 个 API（KnowledgeController 全部端点）
- `api/knowledge/document.ts` — 6 个 API（DocumentController 全部端点）

**后端关键表：**
```
knowledge (id, code, name, description, difficulty, category, tags, status)
knowledge_relation (source_id, target_id, relation_type:PRE/NEXT/INCLUDE/RELATED/SIMILAR, weight)
knowledge_document (id, title, content, doc_type, source, author)
knowledge_doc_relation (doc_id, knowledge_id, relation_type)
```

### 3.2 教育管理（11页 / 11 Controller / 🟡 P1 ~ ⚪ P3）

| 页面 | 路径 | 后端 Controller | API 数 | 说明 |
|------|------|----------------|:-----:|------|
| 学科列表 | `views/education/subject/` | SubjectController | 7 | 标准CRUD，含图标 |
| 教材列表 | `views/education/textbook/` | TextbookController | 6 | 标准CRUD，按学科+年级筛选 |
| 章节列表(树) | `views/education/chapter/` | ChapterController | 6 | 树形结构(NTree)，按教材筛选 |
| 课程列表 | `views/education/course/` | CourseController | 7 | 标准CRUD + 学习操作 |
| 试卷列表 | `views/education/exam/` | ExamController | 6 | 标准CRUD + 成绩提交 |
| 题库列表 | `views/education/question/` | QuestionController | 6 | 标准CRUD，按类型/难度筛选 |
| 学习计划 | `views/education/plan/` | StudyPlanController | 7 | 按学生查看，今日计划 |
| 复习任务 | `views/education/review/` | ReviewController | 5 | 按学生+状态筛选，标记完成 |
| 学情分析 | `views/education/analytics/` | AnalyticsController | 6 | ECharts看板（雷达图/弱项/趋势/总览） |
| 资源列表 | `views/education/resource/` | ResourceController | 6 | 标准CRUD，按学科+类型筛选 |
| 错题列表 | `views/education/wrong-question/` | WrongQuestionController | 5 | 按学生查看，只读（可复位） |

**需新建 API 文件（11个）：**
```
api/education/subject.ts       — 7 API
api/education/textbook.ts      — 6 API
api/education/chapter.ts       — 6 API
api/education/course.ts        — 7 API
api/education/exam.ts          — 6 API
api/education/question.ts      — 6 API
api/education/plan.ts          — 7 API
api/education/review.ts        — 5 API
api/education/analytics.ts     — 6 API
api/education/resource.ts      — 6 API
api/education/wrong-question.ts— 5 API
```

**后端关键表：**
```
subject (id, code, name, grade_level, icon, sort_order, status)
textbook (id, name, subject_code, grade, publisher, isbn)
chapter (id, textbook_id, parent_id, name, chapter_order)  ← 树形
course (id, name, description, subject_code, grade, textbook_id, total_hours, status)
exam (id, name, subject_code, grade, duration, total_score, status)
question (id, subject_code, grade, type, difficulty, content, options, answer, analysis)
study_plan (id, student_id, name, subject_code, start_date, end_date, status)
review_task (id, student_id, knowledge_id, review_date, status)
resource (id, name, type, subject_code, url, description)
wrong_question (id, student_id, question_id, wrong_answer, review_status, review_count)
ability (id, student_id, knowledge_id, remember~create_score, overall_mastery)
study_record (学生学情记录)
```

### 3.3 对话调试 + 文件管理（2页 / 2 Controller / 🔴 P0 + ⚪ P3）

| 页面 | 路径 | 后端 Controller | API 数 | 说明 |
|------|------|----------------|:-----:|------|
| 对话调试 | `views/agent/chat-config/index.vue` | ChatDemoController | 6 | 选平台模型、输入prompt、同步/流式、查看结果 |
| 文件管理 | `views/file/list.vue` | FileController | 1 | 文件列表+上传 |

---

## 第四部分：开发路线图

### 4.1 工作量和优先级

```
P0 (2-3天) ──────────────────────────────────────────
  知识库管理 (5页)   api/knowledge/index.ts + document.ts
  对话调试   (1页)   复用 api/agent/chat.ts
  ↑ 6页 / 2 个新 API 文件

P1 (3-4天) ──────────────────────────────────────────
  学科/教材/章节/课程    (8页)   api/education/4个文件
  试卷/题库             (4页)   api/education/2个文件
  ↑ 12页 / 6 个新 API 文件

P2 (3-4天) ──────────────────────────────────────────
  学习计划/复习任务/学情/资源/错题  (9页)  api/education/5个文件
  ↑ 9页 / 5 个新 API 文件

P3 (0.5天) ──────────────────────────────────────────
  文件管理 (1页)   api/common/file.ts
```

### 4.2 完整进度看板

```
模块             总页数  已完成 待建  完成率
────────────────────────────────────────
仪表盘              2      2     0  100%
系统管理           13     13     0  100%
智能体             14     13     1   93%  ← 缺对话调试
日常记录           10     10     0  100%
知识库管理          5      0     5    0%  ← 待建
教育管理           11      0    11    0%  ← 待建
文件管理            1      0     1    0%  ← 待建
────────────────────────────────────────
合计              56     38    18   68%
```

### 4.3 菜单入库SQL模板（送给后端的参考）

```sql
-- === 知识库管理目录 ===
INSERT INTO `menu` VALUES (600, '知识库管理', 'Knowledge', 'CATALOG', NULL, 1, '/knowledge', '/knowledge/list', 'carbon:knowledge-base', '', '', TRUE, NULL, '知识点与文档管理', TRUE, '1', 7, 0, '0', '0');
INSERT INTO `menu` VALUES (601, '知识点管理', 'KnowledgeList', 'MENU', 600, 1, '/knowledge/list', NULL, 'carbon:concept', '/knowledge/list', '', TRUE, NULL, '知识点CRUD', TRUE, '1', 1, 0, '0', '0');
INSERT INTO `menu` VALUES (602, '知识关系', 'KnowledgeRelation', 'MENU', 600, 1, '/knowledge/relation', NULL, 'carbon:flow', '/knowledge/relation', '', TRUE, NULL, '知识关系管理', TRUE, '1', 2, 0, '0', '0');
INSERT INTO `menu` VALUES (603, '知识图谱', 'KnowledgeGraph', 'MENU', 600, 1, '/knowledge/graph', NULL, 'carbon:network-3', '/knowledge/graph', '', TRUE, NULL, '知识图谱可视化', TRUE, '1', 3, 0, '0', '0');
INSERT INTO `menu` VALUES (604, '文档管理', 'KnowledgeDocument', 'MENU', 600, 1, '/knowledge/document', NULL, 'carbon:document', '/knowledge/document/list', '', TRUE, NULL, '文档CRUD', TRUE, '1', 4, 0, '0', '0');
INSERT INTO `menu` VALUES (605, '索引管理', 'KnowledgeIndex', 'MENU', 600, 1, '/knowledge/index', NULL, 'carbon:data-class', '/knowledge/index', '', TRUE, NULL, '重建索引/状态查看', TRUE, '1', 5, 0, '0', '0');

-- === 教育管理目录 ===
INSERT INTO `menu` VALUES (700, '教育管理', 'Education', 'CATALOG', NULL, 1, '/education', '/education/subject', 'carbon:education', '', '', TRUE, NULL, '教育业务管理目录', TRUE, '1', 8, 0, '0', '0');
INSERT INTO `menu` VALUES (701, '学科管理', 'EducationSubject', 'MENU', 700, 1, '/education/subject', NULL, 'carbon:book', '/education/subject/list', '', TRUE, NULL, '', TRUE, '1', 1, 0, '0', '0');
INSERT INTO `menu` VALUES (702, '教材管理', 'EducationTextbook', 'MENU', 700, 1, '/education/textbook', NULL, 'carbon:notebook', '/education/textbook/list', '', TRUE, NULL, '', TRUE, '1', 2, 0, '0', '0');
INSERT INTO `menu` VALUES (703, '章节管理', 'EducationChapter', 'MENU', 700, 1, '/education/chapter', NULL, 'carbon:tree', '/education/chapter/list', '', TRUE, NULL, '', TRUE, '1', 3, 0, '0', '0');
INSERT INTO `menu` VALUES (704, '课程管理', 'EducationCourse', 'MENU', 700, 1, '/education/course', NULL, 'carbon:course', '/education/course/list', '', TRUE, NULL, '', TRUE, '1', 4, 0, '0', '0');
INSERT INTO `menu` VALUES (705, '试卷管理', 'EducationExam', 'MENU', 700, 1, '/education/exam', NULL, 'carbon:exam', '/education/exam/list', '', TRUE, NULL, '', TRUE, '1', 5, 0, '0', '0');
INSERT INTO `menu` VALUES (706, '题库管理', 'EducationQuestion', 'MENU', 700, 1, '/education/question', NULL, 'carbon:list-boxes', '/education/question/list', '', TRUE, NULL, '', TRUE, '1', 6, 0, '0', '0');
INSERT INTO `menu` VALUES (707, '学习计划', 'EducationPlan', 'MENU', 700, 1, '/education/plan', NULL, 'carbon:task', '/education/plan/list', '', TRUE, NULL, '', TRUE, '1', 7, 0, '0', '0');
INSERT INTO `menu` VALUES (708, '复习任务', 'EducationReview', 'MENU', 700, 1, '/education/review', NULL, 'carbon:rotate', '/education/review/list', '', TRUE, NULL, '', TRUE, '1', 8, 0, '0', '0');
INSERT INTO `menu` VALUES (709, '学情分析', 'EducationAnalytics', 'MENU', 700, 1, '/education/analytics', NULL, 'carbon:chart-radar', '/education/analytics/index', '', TRUE, NULL, '', TRUE, '1', 9, 0, '0', '0');
INSERT INTO `menu` VALUES (710, '资源管理', 'EducationResource', 'MENU', 700, 1, '/education/resource', NULL, 'carbon:document', '/education/resource/list', '', TRUE, NULL, '', TRUE, '1', 10, 0, '0', '0');
INSERT INTO `menu` VALUES (711, '错题管理', 'EducationWrongQ', 'MENU', 700, 1, '/education/wrong-question', NULL, 'carbon:error', '/education/wrong-question/list', '', TRUE, NULL, '', TRUE, '1', 11, 0, '0', '0');

-- === 文件管理 ===
INSERT INTO `menu` VALUES (800, '文件管理', 'FileManager', 'MENU', NULL, 1, '/file', NULL, 'carbon:folder', '/file/list', '', TRUE, NULL, '文件管理', TRUE, '1', 9, 0, '0', '0');
```

### 4.4 侧边栏最终效果预览

```
┌──────────────────────────────────────┐
│  仪表盘                              │
│    ├ 分析页                           │
│    └ 工作空间                          │
│  系统管理                             │
│    ├ 用户管理 / 角色管理 / 菜单管理      │
│    ├ 工作空间管理 / 租户管理             │
│    └ 字典管理 / 时区设置                 │
│  智能体                               │
│    ├ Agent管理 / 平台管理 / 模型管理     │
│    ├ 意图管理 / 对话调试                │
│  日常记录                             │
│    ├ 人物管理 / 时间轴管理 / 记录管理    │
│    └ 媒体管理 / 标签管理                │
│  知识库管理  ← NEW                     │
│    ├ 知识点管理 / 知识关系 / 知识图谱    │
│    └ 文档管理 / 索引管理                │
│  教育管理    ← NEW                     │
│    ├ 学科管理 / 教材管理 / 章节管理      │
│    ├ 课程管理 / 试卷管理 / 题库管理      │
│    ├ 学习计划 / 复习任务                │
│    ├ 学情分析 / 资源管理                │
│    └ 错题管理                          │
│  文件管理    ← NEW                     │
│    └ 文件管理                          │
└──────────────────────────────────────┘
```

