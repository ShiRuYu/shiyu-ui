# ShiYu UI

ShiYu AI 的 Vue 3 管理端，基于 Vben 5.7、Vue 3.5、TypeScript、Vite 与 Naive UI。业务导航由后端权限菜单驱动，前端负责页面组件注册、核心路由与交互体验。

## 产品结构

一级导航按任务域收敛为：

1. 工作台
2. Agent 平台
3. 知识引擎
4. 教育空间
5. 日常记录
6. 系统管理

教育空间继续聚合为“学习、练习与考试、复习、AI 辅学、学习分析、教育配置”六组。完整菜单树与权限边界见 [信息架构说明](./docs/web-naive-layout-redesign.md)。

## 环境要求

- Node.js 22.18+ 或 24.12+
- pnpm 11+
- ShiYu AI 后端（本地默认 `http://127.0.0.1:9000`）

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm -F @vben/web-naive run dev
```

开发服务器默认使用 `apps/web-naive/.env.development`，前端请求统一走 `/api`。不要在仓库环境文件中写入生产凭据、模型密钥或真实租户信息。

## 质量门禁

```bash
# 应用类型检查
pnpm -F @vben/web-naive run typecheck

# web-naive 契约与工具单测
pnpm exec vitest run apps/web-naive/src

# 生产构建
pnpm -F @vben/web-naive run build

# 需先启动前后端，并提供测试账号密码
$env:E2E_PASSWORD='your-password'
pnpm run test:e2e
```

GitHub Actions 会强制按“类型检查 → 应用单测 → 生产构建”执行。Playwright 覆盖桌面与移动端关键路径，可通过 `PLAYWRIGHT_BASE_URL`、`E2E_USERNAME`、`E2E_PASSWORD` 配置目标环境。

## 目录

```text
apps/web-naive/src/
├─ api/             后端 API 与 SSE 协议适配
├─ components/      业务级通用组件
├─ layouts/         主布局与认证布局
├─ locales/         中英文业务文案
├─ router/          核心路由、动态菜单契约与失败恢复
├─ store/           认证及业务状态
└─ views/           页面与模块组件
```

模块边界见 [MODULES.md](./apps/web-naive/docs/MODULES.md)，本轮工程优化与验收记录见 [实施说明](./docs/web-naive-optimization-implementation.md)。

## 动态菜单契约

- 后端 `AUTH_MENU` 决定业务菜单的标题、层级、顺序和可见权限。
- 前端 `src/views/**/*.vue` 是页面组件注册表。
- 运行时会校验菜单节点、路由名称唯一性及组件路径；契约失败会进入可重试错误页，不会留下空白侧栏。
- 工作台、认证、个人中心、菜单失败页和 404 是前端核心路由。

## 发布配置

生产 API 默认使用同源 `/api`。部署平台应显式注入环境变量并由网关转发后端服务。Store 加密密钥只能用于降低本地明文暴露，不能作为服务端安全边界。

本项目继承 Vben Admin 的 MIT 许可代码；业务实现与品牌资源归 ShiYu AI 项目维护。
