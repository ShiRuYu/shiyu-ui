# web-naive 页面布局重新规划方案

> 基于 AI Agent 平台底座 + 多业务域架构日期：2026-07-13 使用技能：naive-ui / vue-best-practices / design-taste-frontend

---

## 一、后端架构全景

后端由 6 个独立 Maven 模块构成：

```
shiyu-ai 后端模块
├─ 📦 shiyu-ai-agent          ← Agent 核心引擎（运行/编排/节点/意图）
├─ 📦 shiyu-ai-auth           ← 系统底座（用户/角色/菜单/租户/字典）
├─ 📦 shiyu-ai-knowledge      ← 知识引擎（知识管理/文档/图谱）
├─ 📦 shiyu-ai-usage          ← 用量统计（平台级数据分析）
│
├─ 📦 shiyu-ai-education      ← 业务域 A：教育
└─ 📦 shiyu-ai-record         ← 业务域 B：日常记录
```

核心架构是 **AI Agent 平台底座 + 可插拔业务域**：Agent 提供 LLM 编排、意图识别、RAG、工具调用等能力，向上为 education / record 等业务域赋能。

---

## 二、当前问题诊断

| 问题 | 说明 |
| --- | --- |
| ❌ **Agent 核心埋没** | Agent 引擎是平台核心，却只排在第 60 位菜单，弱化了"平台"属性 |
| ❌ **教育中心统揽一切** | 教育中心把 7 个功能塞进 SubMenuCards，AI 辅学/数据中心等也被归于教育 |
| ❌ **日常记录无入口** | record 模块代码完整，但完全没有路由文件和菜单入口 |
| ❌ **隐藏菜单泛滥** | 7 个路由模块全部 `hideInMenu: true`，通过卡片跳转，丢失侧边栏导航一致性 |
| ❌ **菜单层级不反映架构** | 菜单结构是"教育中心→卡片→功能"，而非"平台底座 + 业务域" |
| ❌ **虚假占位数据** | Workspace 使用 Github/Vue/React 等教育无关的示例内容 |

---

## 三、目标菜单结构

```
┌─────────────────────────────────────────────────────────────┐
│  📊 工作台                         ← 平台级入口           │
│  ├─ 数据看板 → /analytics          (平台用量概览)          │
│  └─ 工作台   → /workspace          (AI 平台首页)           │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ 平台管理                         ← 平台底座核心       │
│  ├─ Agent 管理 → /agent/admin/list  (Agent 编排)           │
│  ├─ 平台管理   → /agent/platform    (LLM 平台配置)         │
│  ├─ 模型管理   → /agent/model       (模型配置)             │
│  ├─ 意图管理   → /agent/intent      (意图识别)             │
│  └─ 对话调试   → /agent/chat-config (测试控制台)           │
├─────────────────────────────────────────────────────────────┤
│  🧠 知识引擎                         ← 平台核心能力        │
│  ├─ 知识库     → /knowledge/list                           │
│  ├─ 知识图谱   → /knowledge/graph                          │
│  ├─ 文档管理   → /knowledge/document                       │
│  ├─ 索引重建   → /knowledge/index                          │
│  └─ 知识关系   → /knowledge/relation                       │
├─────────────────────────────────────────────────────────────┤
│  🎓 教育空间                         ← 业务域 A           │
│  ├─ 课程学习   → /learning/course                          │
│  ├─ 知识点     → /learning/knowledge                       │
│  ├─ 学习计划   → /learning/plan                            │
│  ├─ 学习资源   → /learning/resource                        │
│  ├─ 题库练习   → /practice/question                        │
│  ├─ 错题本     → /practice/wrong                           │
│  ├─ 在线考试   → /exam/list                                │
│  ├─ AI 组卷    → /exam/ai-exam                             │
│  ├─ 今日复习   → /review/today                             │
│  ├─ 复习历史   → /review/history                           │
│  ├─ AI 讲解    → /ai-tutor/teacher                         │
│  ├─ AI 出题    → /ai-tutor/practice                        │
│  ├─ AI 规划    → /ai-tutor/planner                         │
│  ├─ AI 对话    → /ai-tutor/chat                            │
│  ├─ AI 报告    → /ai-tutor/report                          │
│  ├─ 学习报告   → /analytics-center/report                  │
│  ├─ 能力雷达   → /analytics-center/radar                   │
│  ├─ 学习趋势   → /analytics-center/trend                   │
│  ├─ 薄弱分析   → /analytics-center/weak                    │
│  └─ ⚙️ 后台管理 → [二级折叠子菜单]                         │
│      ├─ 学科管理 → /edu/subject                            │
│      ├─ 教材管理 → /edu/textbook                           │
│      ├─ 章节管理 → /edu/chapter                            │
│      ├─ 课程管理 → /edu/course                             │
│      ├─ 题库管理 → /edu/question                           │
│      ├─ 考试管理 → /edu/exam                               │
│      ├─ 学生管理 → /edu/student                            │
│      ├─ 资源管理 → /edu/resource                           │
│      ├─ 学习计划 → /edu/plan                               │
│      ├─ 复习任务 → /edu/review                             │
│      ├─ 学情分析 → /edu/analytics                          │
│      └─ 错题管理 → /edu/wrong-question                     │
├─────────────────────────────────────────────────────────────┤
│  📓 日常记录                         ← 业务域 B 【新增】  │
│  ├─ 人物管理   → /record/profile                           │
│  ├─ 时间轴     → /record/timeline                          │
│  ├─ 记录内容   → /record/records                           │
│  ├─ 附件管理   → /record/media                             │
│  └─ 标签管理   → /record/tag                               │
├─────────────────────────────────────────────────────────────┤
│  📁 文件管理                         ← 平台基础设施        │
│    → /file                                                 │
├─────────────────────────────────────────────────────────────┤
│  🔧 系统设置                         ← 平台基础设施        │
│  ├─ 用户管理   → /system/user                              │
│  ├─ 角色管理   → /system/role                              │
│  ├─ 菜单管理   → /system/menu                              │
│  ├─ 字典管理   → /system/dict                              │
│  ├─ 租户管理   → /system/tenant                            │
│  ├─ 工作台配置 → /system/workspace                         │
│  ├─ 授权码     → /system/auth-code                          │
│  └─ 关于       → /vben-admin/about                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、需要修改的文件清单

### 4.1 路由文件

| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `router/routes/modules/education-center.ts` | **重写** | 改为「教育空间」一级，展开为扁平子菜单 |
| `router/routes/modules/learning.ts` | 移除 `hideInMenu` | 子菜单直接挂到教育空间下 |
| `router/routes/modules/practice.ts` | 移除 `hideInMenu` | 同上 |
| `router/routes/modules/exam.ts` | 移除 `hideInMenu` | 同上 |
| `router/routes/modules/review.ts` | 移除 `hideInMenu` | 同上 |
| `router/routes/modules/ai-tutor.ts` | 移除 `hideInMenu` | 同上 |
| `router/routes/modules/analytics-center.ts` | 移除 `hideInMenu` | 同上 |
| `router/routes/modules/education-admin.ts` | 移除 `hideInMenu` | 作为教育的子路由保持嵌套 |
| `router/routes/modules/agent.ts` | **重写** | 改为「平台管理」，order 置前 |
| `router/routes/modules/system.ts` | **重写** | 扩展为完整系统设置菜单 |
| `router/routes/modules/record.ts` | **新建** | 日常记录 5 个子菜单 |
| `router/routes/modules/dashboard.ts` | 微调 | 保留两个子页面 |

### 4.2 页面文件

| 文件 | 操作 |
| --- | --- |
| `views/education-center/` | 清理 SubMenuCards.vue + 6 个 index.vue |
| `views/dashboard/workspace/index.vue` | 重写为 AI 平台工作台 |

### 4.3 国际化文件

| 文件                              | 操作             |
| --------------------------------- | ---------------- |
| `locales/langs/zh-CN/record.json` | 已有，无需修改   |
| `locales/langs/zh-CN/page.json`   | 无需修改         |
| `locales/langs/en-US/`            | 学步 record 翻译 |

---

## 五、命名空间对应关系

| 侧边栏分组 | 后端模块 | 前端路由前缀 |
| --- | --- | --- |
| 工作台 | auth / usage | /analytics, /workspace |
| 平台管理 | agent | /agent/\* |
| 知识引擎 | knowledge | /knowledge/\* |
| 教育空间 | education | /learning/_, /practice/_, /exam/_, /review/_, /ai-tutor/_, /analytics-center/_, /edu/\* |
| 日常记录 | record | /record/\* |
| 文件管理 | auth | /file |
| 系统设置 | auth | /system/_, /vben-admin/_ |

---

## 六、实施计划

| 阶段        | 内容                                  | 涉及文件     |
| ----------- | ------------------------------------- | ------------ |
| **Phase 1** | 重写 education-center.ts 为扁平化路由 | 1 个路由文件 |
| **Phase 2** | 重写 agent.ts 为平台管理              | 1 个路由文件 |
| **Phase 3** | 重写 system.ts 为完整系统设置         | 1 个路由文件 |
| **Phase 4** | 新建 record.ts 路由                   | 1 个路由文件 |
| **Phase 5** | 移除 7 个模块的 hideInMenu            | 7 个路由文件 |
| **Phase 6** | 清理 education-center 页面文件        | 7 个文件     |
| **Phase 7** | 重写 workspace 为 AI 平台首页         | 1 个页面文件 |
