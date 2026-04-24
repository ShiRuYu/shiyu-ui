# 服务端交互与数据 Mock

> 官方文档：https://doc.vben.pro/guide/essentials/server.html

## 开发环境跨域配置

### 配置本地接口地址

在 `.env.development` 中配置：

```bash
VITE_GLOB_API_URL=/api
```

### 配置 Vite 代理

在 `apps/web-naive/vite.config.ts` 中配置代理：

```ts
import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // Mock 代理目标地址
            target: 'http://localhost:5320/api',
            ws: true,
          },
        },
      },
    },
  };
});
```

> 浏览器控制台看到的请求 URL 是 `http://localhost:5555/api/xxx`，实际转发到 `http://localhost:5320/api/xxx`。

### 不需要跨域时

直接在 `.env.development` 设置真实接口地址：

```bash
VITE_GLOB_API_URL=https://your-api.com/api
```

## 接口请求

项目使用基于 axios 封装的 `requestClient`，核心由 `@vben/request` 包提供。

### 请求示例

```ts
import { requestClient } from '#/api/request';

// GET 请求
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/user/info');
}

// POST 请求
export async function saveUserApi(user: UserInfo) {
  return requestClient.post<UserInfo>('/user', user);
}

// PUT 请求
export async function updateUserApi(user: UserInfo) {
  return requestClient.put<UserInfo>(`/user/${user.id}`, user);
}

// DELETE 请求
export async function deleteUserApi(userId: number) {
  return requestClient.delete<boolean>(`/user/${userId}`);
}
```

### 扩展配置选项

```ts
type ExtendOptions = {
  // 参数序列化方式
  paramsSerializer?: 'brackets' | 'comma' | 'indices' | 'repeat';
  // 响应数据返回方式
  // raw: 原始 AxiosResponse
  // body: 返回 BODY 部分（忽略 code 判断）
  // data: 只返回 data 字段（会检查 status 和 code）
  responseReturn?: 'body' | 'data' | 'raw';
};
```

### 请求客户端配置（`src/api/request.ts`）

```ts
import { RequestClient } from '@vben/request';
import { useAppConfig } from '@vben/hooks';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string) {
  const client = new RequestClient({ baseURL });

  // 请求头处理（注入 Authorization）
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      config.headers.Authorization = accessStore.accessToken
        ? `Bearer ${accessStore.accessToken}`
        : null;
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 响应数据格式处理
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code', // 接口返回的状态码字段名
      dataField: 'data', // 接口返回的数据字段名
      successCode: 0, // 成功的状态码
    }),
  );

  // Token 过期处理（自动刷新）
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用错误提示
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string) => {
      message.error(msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL);
```

### 多接口地址

```ts
const { apiURL, otherApiURL } = useAppConfig(
  import.meta.env,
  import.meta.env.PROD,
);

export const requestClient = createRequestClient(apiURL);
export const otherRequestClient = createRequestClient(otherApiURL);
```

### 接口返回格式约定

```ts
interface HttpResponse<T = any> {
  code: number; // 0 表示成功
  data: T;
  message: string;
}
```

## 刷新 Token

开启自动刷新 Token：

```ts
// preferences.ts
export const overridesPreferences = defineOverridesPreferences({
  app: { enableRefreshToken: true },
});
```

在 `src/api/request.ts` 中配置 `doRefreshToken`：

```ts
async function doRefreshToken() {
  const accessStore = useAccessStore();
  const resp = await refreshTokenApi();
  const newToken = resp.data;
  accessStore.setAccessToken(newToken);
  return newToken;
}
```

## 数据 Mock

> 注意：生产环境不支持 Mock，请使用真实接口。

项目使用 **Nitro** 作为 Mock 服务器。

### 开启 Mock

在 `.env.development` 中开启：

```bash
VITE_NITRO_MOCK=true
```

### Mock 文件位置

Mock 文件位于 `apps/backend-mock/` 目录下。

### 编写 Mock 接口

```ts
// apps/backend-mock/api/user/index.ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  return {
    code: 0,
    data: {
      userId: '1',
      username: 'admin',
      roles: ['super'],
    },
    message: 'ok',
  };
});
```
