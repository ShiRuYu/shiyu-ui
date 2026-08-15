# QUICK-START.md

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 安装与运行

```bash
# 进入项目目录
cd shiyu-ui

# 安装依赖
pnpm install

# 启动开发服务器
cd apps/web-naive
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck
```

## 开发代理配置

`vite.config.ts` 中配置了 API 代理，默认代理到 `http://localhost:9000`：

```ts
server: {
  proxy: {
    "/api": {
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
      target: "http://localhost:9000",
      ws: true,
    },
  },
}
```

## 生产 API 配置

生产构建默认使用同源 `/api`，部署层应将该路径反向代理到 ShiYu AI 后端。若前后端分域部署，可在构建环境中显式覆盖 `VITE_GLOB_API_URL`；不要把默认值改回公共 Mock 服务。

部署时还应覆盖 `VITE_APP_STORE_SECURE_KEY`，避免多个环境共用仓库内的开发默认值。该值会进入浏览器产物，只用于本地持久化数据的隔离与混淆，不应被当作服务端密钥或安全边界。

## 目录说明

```
src/
├── main.ts           # 应用入口
├── bootstrap.ts      # 启动引导
├── app.vue           # 根组件
├── preferences.ts    # 偏好配置
├── adapter/          # UI 组件适配器
├── api/              # 接口请求层
├── composables/      # 组合式函数
├── layouts/          # 布局组件
├── locales/          # 国际化配置
├── router/           # 路由配置
├── store/            # 状态管理
└── views/            # 页面视图
```

## 编码风格

- 使用 Composition API + `<script setup>` 语法
- 组件命名：PascalCase
- 文件命名：kebab-case（组件文件 PascalCase）
- 类型定义优先使用 `interface`，统一放在 `data.ts` 中
