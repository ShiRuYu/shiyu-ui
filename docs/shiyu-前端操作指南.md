# ShiYu Editor · 前端操作指南

> 基于 Vue Vben Admin 5.x + Vue 3 + Naive UI 的 K12 教育管理系统前端。

---

## 目录

- [一、环境准备](#一环境准备)
- [二、启动项目](#二启动项目)
- [三、目录结构](#三目录结构)
- [四、菜单与路由结构](#四菜单与路由结构)
- [五、核心功能操作](#五核心功能操作)
- [六、与后端对接](#六与后端对接)
- [七、常见问题](#七常见问题)

---

## 一、环境准备

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18.x | 推荐 v20 LTS |
| pnpm | ≥ 9.x | 包管理器，不要用 npm/yarn |
| Git | 任意 | 拉取代码 |

检查命令：

```bash
node -v       # v20.x
pnpm -v       # 9.x
```

## 二、启动项目

### 2.1 安装依赖

```bash
cd shiyu-ui
pnpm install
```

> ⚠️ 首次安装较慢，约 1-3 分钟。不要用 `npm install` 或 `yarn`。

### 2.2 启动开发服务器

```bash
cd apps/web-naive
pnpm dev
```

启动成功日志：
```
  ➜  Local:   http://localhost:5888/
  ➜  Network: http://192.168.x.x:5888/
```

### 2.3 登录验证

打开浏览器访问 `http://localhost:5888/`，使用以下账号登录：

| 角色 | 用户名 | 密码 | 可见范围 |
|------|--------|------|---------|
| 超级管理员 | vben | admin123 | 全部功能 |
| 管理员 | admin | admin123 | 全部功能 |
| 教师 | vben 以 teacher 角色登录 | admin123 | 教育中心全部 7 个分组 |
| 学生 | vben 以 student 角色登录 | admin123 | 不含"管理"分组 |
| 家长 | vben 以 parent 角色登录 | admin123 | 仅数据 + AI 报告 |

> 若以上账号不可用，先在系统管理 → 用户管理中创建账号并分配角色。

---

## 三、目录结构

```
shiyu-ui/
├── apps/
│   └── web-naive/              ← 主应用（入口）
│       └── src/
│           ├── api/            ← 后端 API 调用封装
│           │   ├── education/  ← 教育模块 API
│           │   ├── knowledge/  ← 知识库 API
│           │   ├── system/     ← 系统管理 API
│           │   └── core/      ← 通用 API（登录/菜单/用户）
│           ├── router/
│           │   └── routes/
│           │       └── modules/  ← 路由模块（每个功能模块一个文件）
│           ├── views/          ← 页面组件
│           │   ├── education-center/  ← 教育中心（7 个卡片分组页）
│           │   ├── learning/   ← 课程学习
│           │   ├── practice/   ← 题库练习
│           │   ├── exam/       ← 考试
│           │   ├── review/     ← 复习
│           │   ├── analytics/  ← 数据分析
│           │   ├── ai-tutor/   ← AI 助手
│           │   ├── education-admin/ ← 管理端
│           │   ├── knowledge-engine/ ← 知识库管理
│           │   ├── system/     ← 系统管理
│           │   ├── agent/      ← 智能体
│           │   ├── record/     ← 日常记录
│           │   ├── file/       ← 文件管理
│           │   └── dashboard/  ← 仪表盘
│           ├── locales/        ← 多语言
│           └── layouts/        ← 布局
├── packages/                   ← 公共组件库（Vben 框架）
└── package.json
```

---

## 四、菜单与路由结构

### 4.1 左侧菜单层级

当前系统左侧菜单共 **7 项**：

```
仪表盘
教育中心（含 7 个卡片分组） ← 主要业务入口
   ├── 学习    → /learning/course, /learning/knowledge ...
   ├── 练习    → /practice/question, /practice/wrong
   ├── 考试    → /exam/list, /exam/ai-exam
   ├── 复习    → /review/today, /review/history
   ├── 数据    → /analytics-center/report, /analytics-center/radar ...
   ├── AI助手  → /ai-tutor/teacher, /ai-tutor/chat ...
   └── 管理    → /edu/subject, /edu/course ...（仅老师/管理员可见）
日常记录
智能体
知识库管理
文件管理
系统管理
```

### 4.2 路由文件位置

每个功能模块对应一个路由文件，位于 `apps/web-naive/src/router/routes/modules/`：

| 文件 | 对应菜单 |
|------|---------|
| `education-center.ts` | 教育中心（含 7 个分组） |
| `dashboard.ts` | 仪表盘 |
| `record.ts` → 实际在 `modules/` 中 | 日常记录 |
| `system.ts` | 系统管理 |
| `agent.ts` | 智能体 |
| `knowledge-engine.ts` | 知识库管理 |
| `file.ts` | 文件管理 |

> 旧模块（`learning.ts`, `practice.ts`, `exam.ts` 等）已用 `hideInMenu: true` 隐藏，路由仍然保留用于页面跳转。

### 4.3 卡片分组机制

"教育中心"的每个分组（学习/练习/考试/复习/数据/AI助手/管理）都是一个**卡片页**，点击卡片进入具体功能页面：

```
教育中心 → 学习（卡片页）
  ├── [卡片] 课程学习   → /learning/course
  ├── [卡片] 知识浏览   → /learning/knowledge
  ├── [卡片] 学习计划   → /learning/plan
  └── [卡片] 学习资源   → /learning/resource
```

卡片页位于 `views/education-center/{分组}/index.vue`，使用 `SubMenuCards.vue` 通用组件渲染。

### 4.4 如何新增/修改菜单

**方式一：前端路由配置（优先级高）**

1. 在 `router/routes/modules/` 中新建一个 `.ts` 文件
2. 参考 `dashboard.ts` 格式定义路由
3. 无需其他配置，自动注册

**方式二：后端数据库配置（用于权限控制）**

1. 后端新增 `menu` 表记录
2. admin 用户在系统管理 → 菜单管理中为角色分配权限

---

## 五、核心功能操作

### 5.1 教育中心操作流

```
登录 → 进入教育中心 → 选择分组 → 点击卡片 → 进入功能页
                       ↓
                   学习/练习/考试/复习/数据/AI助手/管理
```

### 5.2 仪表盘

访问 `/dashboard`，显示：
- 分析页：数据总览（用户量、访问量等）
- 工作台：快捷操作入口

### 5.3 系统管理

| 功能 | 路径 | 说明 |
|------|------|------|
| 用户管理 | `/system/user` | 用户 CRUD、角色分配 |
| 菜单管理 | `/system/menu` | 菜单树 CRUD、权限码配置 |
| 角色管理 | `/system/role` | 角色 CRUD、菜单权限分配 |
| 工作空间管理 | `/system/workspace` | 多租户组织架构 |
| 字典管理 | `/system/dict` | 系统字典维护 |
| 租户管理 | `/system/tenant` | 租户 CRUD |

### 5.4 日常记录

| 功能 | 路径 | 说明 |
|------|------|------|
| 人物管理 | `/record/profile` | 人物基本信息管理 |
| 时间轴管理 | `/record/timeline` | 事件时间线管理 |

### 5.5 文件管理

访问 `/file`，支持拖拽上传文件，自动上传到后端服务器。

---

## 六、与后端对接

### 6.1 代理配置

环境配置文件位于 `apps/web-naive/`：

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境 |
| `.env.production` | 生产环境 |

```bash
# .env.development
VITE_PORT=5888           # 前端端口
VITE_GLOB_API_URL=/api   # API 路径前缀
VITE_NITRO_MOCK=true     # 是否启用 Mock
```

### 6.2 开发时对接本地后端

默认前端通过 `/api` 路径请求后端，Vite 自动代理到后端端口：

```typescript
// apps/web-naive/src/api/request.ts
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
// 开发环境 apiURL = 'http://localhost:9000'（自动代理）
```

后端默认端口 9000，如需修改：

```bash
# 后端已修改端口时，更改前端代理配置
```

### 6.3 Mock 模式

`VITE_NITRO_MOCK=true` 时使用前端 Mock 数据（独立于后端运行）。
`VITE_NITRO_MOCK=false` 时请求真实后端。

> 开发阶段建议开启 Mock（后端未就绪时可独立开发），联调时关闭。

---

## 七、常见问题

### Q1: `pnpm install` 报错

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot find a lockfile
```

**解决：** 确认使用 pnpm 9+，删除 `pnpm-lock.yaml` 重新安装。

### Q2: 启动后页面空白 / 404

**解决：** 检查浏览器控制台是否有 JSON 解析错误，通常是 `page.json` 语言文件格式损坏。用 `python3 -m json.tool page.json` 验证格式。

### Q3: 登录后菜单不显示

**原因：** 后端未返回菜单数据（Mock 模式下已启用）。
**解决：** 检查后端 `/menu/all` 接口是否正常返回，或关闭 Mock 直接联调。

### Q4: "教育中心"菜单项未显示

**原因：** 后端数据库缺少 `18__data_menu_edu_center.sql` 的迁移数据。
**解决：** 后端重启时应用最新 migration，检查 `menu` 表是否有 id=1500~1507 的记录。

### Q5: 页面接口报跨域错误

**解决：**
- 开发环境：Vite 自动代理，无需配置 CORS
- 生产环境：后端 `application.yml` 配置 `cors.allowedOrigins`

### Q6: npm run build 打包失败

```bash
# 需要先构建公共包
cd shiyu-ui
pnpm build
```

---

> **相关文件：**
> - 路由配置：`apps/web-naive/src/router/routes/modules/`
> - 卡片组件：`apps/web-naive/src/views/education-center/SubMenuCards.vue`
> - API 封装：`apps/web-naive/src/api/`
> - 多语言：`apps/web-naive/src/locales/langs/zh-CN/page.json`
