# shiyu-ui 项目文档

> 基于 Vben Admin v5.7 的 AI 教育平台前端

## 📋 文档目录

| 文档                                         | 说明              |
| -------------------------------------------- | ----------------- |
| [QUICK-START.md](./QUICK-START.md)           | 快速开始          |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | 项目架构总览      |
| [MODULES.md](./MODULES.md)                   | 业务模块详情      |
| [API.md](./API.md)                           | API 层规范        |
| [ROUTER.md](./ROUTER.md)                     | 路由系统          |
| [STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md) | 状态管理          |
| [COMPOSABLES.md](./COMPOSABLES.md)           | 组合式函数        |
| [COMPONENTS.md](./COMPONENTS.md)             | 组件开发指南      |
| [STREAMING.md](./STREAMING.md)               | AI Streaming 架构 |
| [CODING-STANDARDS.md](./CODING-STANDARDS.md) | 编码规范          |

## 🏗️ 技术栈

| 技术                    | 用途      |
| ----------------------- | --------- |
| Vue 3 + Composition API | 前端框架  |
| TypeScript              | 类型系统  |
| Vite                    | 构建工具  |
| Naive UI                | UI 组件库 |
| Pinia                   | 状态管理  |
| Vue Router              | 路由      |
| Vben Admin v5.7         | 后台框架  |
| Vxe Table               | 表格组件  |

## 🚀 快捷命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm typecheck
```

## 📁 项目结构

```
apps/web-naive/src/
├── adapter/       # UI 适配器（Naive UI）
├── api/           # API 接口层
├── composables/   # 组合式函数
├── layouts/       # 布局组件
├── locales/       # 国际化
├── router/        # 路由
├── store/         # Pinia 状态
└── views/         # 视图页面
```
