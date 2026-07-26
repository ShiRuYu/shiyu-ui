# ROUTER.md — 路由系统

## 一、路由结构

```
router/
├── index.ts           # 路由创建 + 注册
├── guard.ts           # 路由守卫（权限校验）
├── access.ts          # 权限访问控制
└── routes/
    ├── index.ts       # 路由聚合
    ├── core.ts        # 核心路由（根路由、登录、404）
    ├── modules/       # 动态路由（业务模块）
    └── static/        # 静态后备路由
```

## 二、路由类型

### 核心路由 `core.ts`

包含必须存在的路由：
- **Root** (`/`) — 基础布局容器，重定向到首页
- **Authentication** (`/auth`) — 认证布局，包含登录/注册/忘记密码
- **FallbackNotFound** — 404 兜底

### 动态路由 `modules/`

通过 `import.meta.glob` 自动扫描加载：

```ts
const dynamicRouteFiles = import.meta.glob("./modules/**/*.ts", { eager: true });
```

**当前仅有**：
- `modules/dashboard.ts` — 仪表盘路由

其他业务模块路由**尚未模块化**，需要逐步迁移。

### 静态路由 `static/`

作为动态路由的备选，在后端未返回时使用默认菜单。

## 三、路由配置示例

```ts
// router/routes/modules/dashboard.ts
import type { RouteRecordRaw } from "vue-router";
import { $t } from "#/locales";

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: "lucide:layout-dashboard",
      order: -1,
      title: $t("page.dashboard.title"),
    },
    name: "Dashboard",
    path: "/dashboard",
    children: [
      {
        name: "Analytics",
        path: "/analytics",
        component: () => import("#/views/dashboard/analytics/index.vue"),
        meta: {
          affixTab: true,
          icon: "lucide:area-chart",
          title: $t("page.dashboard.analytics"),
        },
      },
      {
        name: "Overview",
        path: "/overview",
        component: () => import("#/views/dashboard/overview/index.vue"),
        meta: {
          icon: "lucide:layout-dashboard",
          title: $t("page.dashboard.overview"),
        },
      },
    ],
  },
];

export default routes;
```

## 四、路由 Meta 规范

| Meta 属性 | 类型 | 说明 |
|-----------|------|------|
| `title` | `string` | 页面标题（支持 $t 国际化） |
| `icon` | `string` | 菜单图标（Iconify 格式） |
| `order` | `number` | 菜单排序 |
| `affixTab` | `boolean` | 是否固定标签页 |
| `hideInMenu` | `boolean` | 是否在菜单隐藏 |
| `hideInTab` | `boolean` | 是否在标签页隐藏 |
| `hideInBreadcrumb` | `boolean` | 是否在面包屑隐藏 |

## 五、路由守卫 `guard.ts`

守卫流程：

```
路由跳转
  │
  ├── 白名单路径（登录页等） → 直接放行
  │
  └── 需要认证路径
       │
       ├── 未登录 → 跳转登录页
       │
       └── 已登录
            │
            ├── 权限校验 → 无权限 → 403
            │
            └── 有权限 → 放行
```

## 六、路由组织建议

**当前问题**：所有业务路由未按模块拆分为独立文件。

**推荐结构**：

```
router/routes/modules/
├── dashboard.ts      # 仪表盘 ✅ 已存在
├── agent.ts          # Agent 管理（待添加）
├── knowledge.ts      # 知识引擎（待添加）
├── education.ts      # 教育模块（待添加）
├── system.ts         # 系统管理（待添加）
├── record.ts         # 成长记录（待添加）
└── ...
```

**推荐 Route Meta 扩展**：

```ts
meta: {
  cache: true,          // 是否缓存页面
  skeleton: "list",     // 骨架屏类型
  transition: "fade",   // 页面过渡动画
  permission: "admin",  // 所需权限
  breadcrumb: ["首页", "配置"], // 自定义面包屑
  search: true,         // 是否显示搜索
}
```
