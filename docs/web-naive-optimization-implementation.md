# web-naive 工程与体验优化实施说明

> 状态：已实施
>
> 更新：2026-08-10
>
> 范围：`shiyu-ui/apps/web-naive` 与 `shiyu-ai` 菜单、认证和流式对话契约

## 1. 实施结果

| 原问题 | 实施结果 | 主要位置 |
| --- | --- | --- |
| 生产 API 指向 Mock | 默认改为同源 `/api`，部署环境负责覆盖 | `apps/web-naive/.env.production` |
| `/dashboard` 父路由不可达、静态导航目录缺失 | 工作台恢复为前端静态路由，增加显式重定向、相对子路由和旧地址别名 | `router/routes/static/workbench.ts` |
| Vben Modal 类型迁移不完整 | 31 处 Modal 数据泛型迁移，类型错误归零 | 各模块 `modules/form.vue` |
| 导航层级过长 | 六个一级任务域；教育空间六组二级聚合 | `docs/web-naive-layout-redesign.md` |
| 后端菜单可能引用不存在页面 | 请求后运行 Schema、唯一名称和组件路径校验 | `router/menu-contract.ts` |
| 菜单失败只剩空壳 | 增加独立失败页、重试和返回登录 | `views/_core/fallback/menu-load-error.vue` |
| Vben 演示内容进入生产 | 删除演示静态路由、假通知和模板外链；替换品牌、Logo、版权 | `layouts/basic.vue`、`preferences.ts` |
| 客户端滑块验证码无服务端校验 | 删除无安全收益的本地滑块；后续验证码必须由后端签发和验证 | `views/_core/authentication/login.vue` |
| 角色/租户切换强制刷新 | 同步用户和权限码，原地重建权限路由；全局入口先完成离页检查并返回原路径 | `store/auth.ts`、`layouts/basic.vue`、个人中心 |
| Agent 卡片固定三列、伪分页 | 改为 1/2/3 列响应式、真实服务端分页、可换页大小 | `views/agent/admin/agent-list.vue` |
| 固定宽度弹窗溢出 | Agent、教育、记录、系统弹窗统一采用视口宽度加最大宽度 | 各模块 `modules/form.vue` |
| 课程、计划等固定列数 | 课程/资源 1–4 列，Agent/计划/考试 1–3 列，复习 1–2 列 | 对应列表页 |
| 可点击卡片不可键盘操作 | 课程和学习计划卡支持 Enter、Space、焦点轮廓和 link 语义 | 对应列表页 |
| AI 对话同步输出整段 JSON | 改用 SSE 内容字段，支持停止、重试、复制、自动滚动与错误恢复 | `views/ai-tutor/chat/index.vue` |
| 对话调试依赖后端默认模型 | AI 对话页和模型调试弹窗均支持平台切换，并只加载该平台下模型；请求明确携带平台代码和模型名 | `views/ai-tutor/chat/`、`views/agent/model/modules/chat-dialog.vue` |
| SSE 按网络 chunk 拼接 | 增加跨 chunk 帧缓存、多行 data 解析、AbortSignal 和 `[DONE]` 处理 | `api/stream.ts` |
| 模型输出缺少 Markdown/代码块 | 使用先转义再渲染的安全 Markdown 子集 | `utils/markdown.ts` |
| Agent 编辑器职责混杂 | 拆出基本信息、版本管理、画布、节点表单、校验结果和调试弹窗 | `views/agent/admin/modules/` |
| 编辑离开会丢数据 | 基本信息和图配置独立脏状态，路由切换/关闭窗口前确认 | `agent-edit.vue` |
| Agent 缺少闭环操作 | 编辑页形成“编辑 → 校验 → 保存 → 发布 → 调试”路径 | `agent-edit.vue` |
| 主题色硬编码 | 核心 Agent 画布与聊天使用业务设计 Token，指标卡统一 | `agent-flow-canvas.vue`、业务组件 |
| 无跳过导航与焦点恢复 | 增加 skip link；路由完成后将焦点恢复到主标题 | `layouts/basic.vue` |
| Token 过期出现两条错误 | 认证失效采用单例跳转，跳过无意义的二次登出请求，并抑制已处理 401 的通用错误提示 | `api/request.ts`、请求拦截器 |
| 工作台窄屏截断且统计为 0 | 指标和排行改为响应式网格；后端归一化 overview 字段并返回真实平台、模型、调用与 Token 指标 | `views/dashboard/overview/`、`UsageRecordRepositoryImpl` |
| CI 实际未运行 | 移除上游仓库名条件，强制 typecheck、Vitest、production build | `.github/workflows/ci.yml` |

## 2. 业务级通用组件

`src/components/business` 提供：

- `FilterBar`：筛选字段和页面操作的换行、移动端占满规则；
- `BusinessEmptyState`：统一空状态与下一步操作；
- `MetricCard`：统一指标标题、值、描述和高度。

新增业务页应优先组合 Vben `Page` 与上述组件。弹窗宽度使用 `w-[92vw] max-w-[…px]`，不再只写固定像素宽度。

## 3. 流式协议

后端 `/chat/send-stream` 明确声明 `text/event-stream`。每个 SSE `data:` 字段是一个 `ChatResponse` JSON：

```json
{ "success": true, "content": "增量文本", "platform": "…", "model": "…" }
```

前端只追加 `content`，错误响应抛给页面恢复逻辑；页面卸载或用户点击“停止生成”时通过 `AbortController` 取消网络读取。Agent 执行流复用同一 SSE 帧解析器。

## 4. 国际化与无障碍约定

- 新增核心交互均同时提供 `zh-CN` 与 `en-US` 文案；Agent 编排的节点、连线、校验、停止生成等操作已迁移。
- 应用 14 组中英文 JSON 文件保持文件和叶子键完全一致，`locale-parity.test.ts` 在 Vitest 中阻止缺键回归；本轮将缺失英文键从 295 个降为 0。
- AI 讲解、出题、规划、报告、对话、平台/模型调试和工作台不再直接写用户可见中文。源码 CJK 扫描仍用于发现历史页面候选，注释和业务中文数据不能仅凭扫描结果自动替换。
- 流式回复容器使用 `role="log"` 与 `aria-live="polite"`。
- 页面跳转后主标题可获得程序化焦点；键盘用户可直接跳到 `main`。
- 可点击非按钮内容必须提供语义角色、`tabindex`、Enter/Space 操作及清晰焦点样式。
- 图表的分类色属于数据编码，不等同于页面主题色；页面容器、卡片、文本和边框使用设计 Token。

## 5. 自动化验证

前端：

```bash
pnpm -F @vben/web-naive run typecheck
pnpm exec vitest run apps/web-naive/src
pnpm -F @vben/web-naive run build

$env:E2E_PASSWORD='your-password'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:5888'
pnpm run test:e2e
```

Playwright 用例覆盖：登录、六域导航及六个教育分组、模板残留、全部 65 个授权菜单页面、代表性业务路由水平溢出、手机视口、平台/模型联动的 SSE 请求体，以及 Token 过期无重复错误。

后端：

```bash
mvn -DskipITs test
```

后端 GitHub Actions 使用 Java 21 执行完整 Maven reactor。`ChatDemoControllerTest` 固化 SSE Content-Type 与内容增量契约；`DatabaseInitializerTest` 固化菜单基线与 v1 → v2 迁移。

## 6. 发布检查

1. 生产环境显式确认 `/api` 网关、HTTPS、Cookie/Token 策略与 Store key。
2. 使用真实角色验证六个一级导航及教育配置权限差异。
3. 使用真实模型验证同步、流式、主动停止和错误重试。
4. 在 390、768、1280 像素视口执行 Playwright 与人工抽查。
5. TypeScript、Vitest、Maven、生产构建和 Playwright 全部通过后发布。
