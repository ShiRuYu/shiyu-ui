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

教育空间继续聚合为“学习、练习与考试、复习、AI 辅学、学习分析、教育配置”六组。完整产品说明从 [前端文档导航](./docs/文档导航.md) 进入，76 个菜单路由与角色基线见 [页面路由与角色清单](./docs/参考/页面路由与角色清单.md)。

## 环境要求

- Node.js 22.18+ 或 24.12+
- pnpm 11+
- ShiYu AI 后端（本地默认 `http://127.0.0.1:9000`）

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm -F @vben/web-naive run dev
```

前后端联调请使用同一组修复分支：UI 仓库 `fix/2026-10-05-cross-repo-repairs` 与 ShiYu AI 后端同名分支。先在后端仓库执行 `mvn -pl modules/applications/shiyu-ai-bootstrap -am package`，再按后端 README 启动本地 H2 开发服务；前端 `.env.development` 默认连接 `http://127.0.0.1:9000`。学生流程需要当前登录用户绑定一个有效学生档案，考试还需由管理员完成组卷与发布。

开发服务器默认使用 `apps/web-naive/.env.development`，前端请求统一走 `/api`。不要在仓库环境文件中写入生产凭据、模型密钥或真实租户信息。

## 质量门禁

```bash
# 应用类型检查
pnpm -F @vben/web-naive run typecheck

# web-naive 契约与工具单测
pnpm exec vitest run apps/web-naive/src

# 功能边界、后端接口快照与生成类型
pnpm check:boundaries
pnpm test:contract
pnpm test:openapi
pnpm test:menus

# 功能源码覆盖率（包括未被测试导入的 TypeScript 和 Vue 文件）
pnpm test:coverage

# 生产构建
pnpm -F @vben/web-naive run build

# 需先启动前后端，并提供测试账号密码
$env:E2E_PASSWORD='your-password'
pnpm run test:e2e
```

GitHub Actions 会执行“类型检查 → 应用单测 → 生产构建”，并使用一次性 H2 后端运行无模型依赖的考试浏览器流程。该流程使用 H2 种子账号 `admin/123456`，仅连接 CI 本机启动的临时服务；`SHIYU_BACKEND_REF` 仓库变量可指定配套后端分支或提交，未设置时使用前端同名分支。手动运行其他 Playwright 流程时，可通过 `PLAYWRIGHT_BASE_URL`、`E2E_USERNAME`、`E2E_PASSWORD` 配置目标环境。

独立的覆盖率任务执行 `pnpm test:coverage`：逐个功能域要求行覆盖率 90%、分支覆盖率 80%，并核对实际源码清单，漏采集文件也会失败。只有纯类型、纯导出或空目录才允许按无运行逻辑跳过；测试通过不代表覆盖率达标。JSON 报告写入 `coverage/`，CI 即使失败也会上传报告，便于定位待补测文件。

`pnpm test:menus` 在相邻 `shiyu-ai` 仓库存在时读取真实导航 SQL，否则使用契约快照；可通过 `SHIYU_BACKEND_ROOT` 指定配对后端。指定的后端缺少 SQL 时会报错，不回退掩盖错误。浏览器 CI 在检出配对后端后也会运行该检查。

更新接口快照时，先启动上述配套后端，然后执行 `pnpm test:contract:update` 和 `pnpm exec node scripts/contracts/generate-openapi.mjs`，检查生成差异后运行 `pnpm test:contract && pnpm test:openapi`。新接口必须同时更新服务端与前端契约，避免单独从主分支拉取不匹配的后端版本。

## 目录

```text
apps/web-naive/src/
├─ api/             后端 API 与 SSE 协议适配
├─ components/      业务级通用组件
├─ layouts/         主布局与认证布局
├─ locales/         中英文业务文案
├─ router/          核心路由、动态菜单契约与失败恢复
├─ store/           认证及业务状态
└─ features/        领域 Feature Slice 页面与模块组件
```

模块边界见 [MODULES.md](./apps/web-naive/docs/MODULES.md)，本轮工程优化、契约和联调结果见后端仓库的 [质量与联调报告](../shiyu-ai/docs/质量与联调报告.md)。

## 动态菜单契约

- 后端 `AUTH_MENU` 决定业务菜单的标题、层级、顺序和可见权限。
- 前端按 `src/features/<domain>` 组织 Feature Slice，页面从 feature 公共入口装配。
- 运行时会校验菜单节点、路由名称唯一性及组件路径；契约失败会进入可重试错误页，不会留下空白侧栏。
- 工作台、认证、个人中心、菜单失败页和 404 是前端核心路由。

## 发布配置

生产 API 默认使用同源 `/api`。部署平台应显式注入环境变量并由网关转发后端服务。Store 加密密钥只能用于降低本地明文暴露，不能作为服务端安全边界。

本项目继承 Vben Admin 的 MIT 许可代码；业务实现与品牌资源归 ShiYu AI 项目维护。
