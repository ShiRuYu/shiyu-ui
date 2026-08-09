# web-naive 信息架构与导航实施方案

> 状态：已实施更新日期：2026-08-10适用范围：`apps/web-naive` 与 `shiyu-ai` 动态菜单接口

## 1. 设计目标

导航按“平台能力 + 业务空间”组织，避免按技术模块或页面数量平铺。用户应先识别任务域，再进入具体页面。

一级导航固定为：

1. 工作台
2. Agent 平台
3. 知识引擎
4. 教育空间
5. 日常记录
6. 系统管理

其中“工作台”由前端核心路由注册，其余五项由后端权限菜单返回。文件管理不再占用一级入口，归入系统管理。

## 2. 目标菜单树

```text
工作台
├─ 平台概览                 /dashboard/overview
└─ 数据看板                 /dashboard/analytics

Agent 平台                  /platform
├─ Agent                    /agent/definition/list
├─ 平台管理                 /agent/platform
├─ 模型管理                 /agent/model
├─ 对话调试                 /agent/chat-config
└─ 意图管理                 /agent/intent

知识引擎                    /knowledge
├─ 企业知识工作台           /knowledge/workbench
├─ 空间管理                 /knowledge/spaces
├─ 知识资产                 /knowledge/assets
├─ 文档中心                 /knowledge/documents
├─ 图谱洞察                 /knowledge/graph
├─ 检索实验室               /knowledge/search
├─ 索引与任务               /knowledge/index
├─ 系统运维                 /knowledge/operations
└─ 评测中心                 /knowledge/evaluations

教育空间                    /education-center
├─ 学习
│  ├─ 课程学习             /learning/course
│  ├─ 知识浏览             /learning/knowledge
│  ├─ 学习计划             /learning/plan
│  └─ 学习资源             /learning/resource
├─ 练习与考试
│  ├─ 题库练习             /practice/question
│  ├─ 错题本               /practice/wrong
│  ├─ 在线考试             /exam/list
│  └─ AI 组卷              /exam/ai-exam
├─ 复习
│  ├─ 今日复习             /review/today
│  └─ 复习历史             /review/history
├─ AI 辅学
│  ├─ AI 讲解              /ai-tutor/teacher
│  ├─ AI 出题              /ai-tutor/practice
│  ├─ AI 规划              /ai-tutor/planner
│  ├─ AI 对话              /ai-tutor/chat
│  └─ AI 报告              /ai-tutor/report
├─ 学习分析
│  ├─ 学习报告             /analytics-center/report
│  ├─ 能力雷达             /analytics-center/radar
│  ├─ 学习趋势             /analytics-center/trend
│  └─ 薄弱分析             /analytics-center/weak
└─ 教育配置                /education-center/config
   ├─ 学科管理             /edu/subject
   ├─ 教材管理             /edu/textbook
   ├─ 章节管理             /edu/chapter
   ├─ 课程管理             /edu/course
   ├─ 题库管理             /edu/question
   ├─ 考试管理             /edu/exam
   ├─ 学生管理             /edu/student
   ├─ 学习计划             /edu/plan
   ├─ 复习任务             /edu/review
   ├─ 学情分析             /edu/analytics
   ├─ 资源管理             /edu/resource
   └─ 错题管理             /edu/wrong-question

日常记录                    /record
├─ 人物管理                 /record/profile
├─ 时间轴                   /record/timeline
├─ 记录内容                 /record/records
├─ 标签管理                 /record/tags
└─ 附件管理                 /record/media

系统管理                    /system
├─ 用户管理                 /system/user
├─ 角色管理                 /system/role
├─ 菜单管理                 /system/menu
├─ 租户管理                 /system/tenant
├─ 字典管理                 /system/dict
├─ 权限码管理               /system/auth-code
└─ 文件管理                 /file
```

课程详情、学习过程、答题、考试与结果页继续作为隐藏路由挂在对应分组下，不占用侧栏空间。

## 3. 路由与菜单所有权

- `accessMode: mixed` 保持不变。
- 前端只注册工作台、认证页、个人中心、404 等核心能力路由。
- 后端 `AUTH_MENU` 是业务菜单标题、顺序、层级和角色可见性的权威来源。
- 前端 `views/**/*.vue` 是组件路径注册表；后端 `component` 必须能映射到真实 Vue 文件。
- 所有现有业务 URL 保持不变。教育分组目录只承担导航和重定向，不改变 API 或书签地址。

## 4. 权限规则

- 超级管理员和管理员拥有六个教育分组。
- 普通用户拥有学习、练习与考试、复习、AI 辅学、学习分析，不授予教育配置。
- 新增分组目录必须与其任一已授权子页面同时授权，否则路由树会因缺少祖先节点而不可达。
- 存量数据库升级会根据已有子页面授权自动补充分组目录授权，不扩大原有页面权限。

## 5. 兼容与升级

- `/dashboard` 重定向到 `/dashboard/overview`。
- `/overview` 与 `/analytics` 保留为兼容别名，新代码使用 `/dashboard/*`。
- 后端基线版本为 `2`。版本 `1` 启动时执行事务迁移：重命名一级菜单、移动文件管理、增加教育分组、重建父子关系并补齐租户/角色目录授权。
- 迁移不修改业务页面 path、component 或权限码。

## 6. 验收标准

1. 管理员看到六个一级导航，且没有独立的文件管理一级入口。
2. 教育空间直属可见子项恰好为六个目录。
3. 普通用户不显示教育配置，但其他已授权教育页面仍可访问。
4. `/dashboard`、旧别名和全部业务 URL 均可正常打开。
5. 后端新库初始化与版本 1 升级测试通过。
6. 前端路由单测、类型检查、生产构建和 Playwright 菜单回归通过。

## 7. 相关实现

- 前端工作台路由：`apps/web-naive/src/router/routes/modules/dashboard.ts`
- 后端菜单基线：`infrastructure/shiyu-ai-dal/src/main/resources/db/baseline/h2/seed/02_auth.sql`
- 后端升级脚本：`infrastructure/shiyu-ai-dal/src/main/resources/db/migration/h2/01_menu_information_architecture.sql`
- 后端架构说明：`shiyu-ai/docs/architecture/菜单信息架构.md`
- 工程与体验优化：`docs/web-naive-optimization-implementation.md`
