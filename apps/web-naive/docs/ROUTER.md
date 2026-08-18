# ROUTER.md — 路由与动态菜单

## 1. 运行模式

`apps/web-naive` 使用 Vben `mixed` 权限模式：

```ts
app: {
  accessMode: 'mixed',
}
```

前端路由与后端菜单按 `name` 合并。业务菜单的层级、标题、顺序和可见性由后端 `/v1/system/menus/all` 返回，前端负责把 `component` 字符串映射到 `src/views/**/*.vue`。

## 2. 路由目录

```text
src/router/
├─ index.ts                 路由创建
├─ guard.ts                 登录、权限和首页守卫
├─ access.ts                获取后端菜单并生成可访问路由
└─ routes/
   ├─ core.ts               根路由、认证、个人中心、404
   ├─ modules/workbench.ts  工作台路由
   └─ static/               必要的静态后备路由
```

业务页面不应再重复创建一套完整的前端菜单树。新增业务页面时：

1. 在 `src/views` 创建组件；
2. 在后端菜单中登记唯一 `name`、URL 和组件路径；
3. 为租户和角色分配菜单；
4. 验证组件路径与真实 Vue 文件一致。

## 3. 工作台路由

工作台是前端拥有的一级入口。子路由必须使用相对路径，父路由必须有明确重定向：

```ts
const routes: RouteRecordRaw[] = [
  {
    name: 'Workbench',
    path: '/workbench',
    redirect: '/workbench/overview',
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
      },
      {
        name: 'Overview',
        path: 'overview',
        component: () => import('#/views/dashboard/overview/index.vue'),
      },
    ],
  },
];
```

工作台规范地址是 `/workbench/overview`；业务域页面由后端菜单直接注册，不再保留旧工作台别名。

## 4. 后端菜单契约

后端路由对象至少包含：

| 字段              | 规则                                               |
| ----------------- | -------------------------------------------------- |
| `name`            | 全局唯一，作为前后端合并键                         |
| `path`            | 页面使用稳定绝对 URL；目录使用不会与页面冲突的路径 |
| `type`            | `catalog`、`menu`、`link` 或 `embedded`            |
| `component`       | 页面对应 `/目录/文件`；目录留空                    |
| `redirect`        | 有子页面的目录必须指向一个可访问页面               |
| `meta.title`      | 用户可见标题                                       |
| `meta.order`      | 同级排序                                           |
| `meta.hideInMenu` | 详情、执行中、结果页等隐藏路由设为 `true`          |
| `children`        | 必须包含所有已授权祖先节点，支持任意深度           |

目录本身不渲染页面。Vben 会在根 `BasicLayout` 内注册目录树，最终页面组件仍渲染到主内容区。

## 5. 信息架构

一级导航为工作台、Agent 平台、知识引擎、教育空间、日常记录、系统管理。教育空间继续聚合为学习、练习与考试、复习、AI 辅学、学习分析、教育配置。

完整树、权限规则与升级兼容策略见 [`docs/web-naive-layout-redesign.md`](../../../docs/web-naive-layout-redesign.md)。

## 6. 变更检查

路由或菜单变更至少执行：

```bash
pnpm exec vitest run apps/web-naive/src/router/__tests__/dashboard.test.ts --dom
pnpm -F @vben/web-naive run typecheck
pnpm -F @vben/web-naive run build
```

联调时还应检查：

- `/v1/system/menus/all` 的一级菜单名称和顺序；
- 教育空间直属可见子目录数量必须为 6；
- 每个后端 `component` 都能映射到 Vue 文件；
- 管理员与普通用户的目录授权不同但页面权限不被扩大；
- `/workbench` 与 `/workbench/overview` 可访问且不会出现空白内容区。
