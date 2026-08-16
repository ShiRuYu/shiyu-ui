# API.md — API 层规范

## 一、接口层架构

```
src/api/
├── index.ts           # 统一导出
├── request.ts         # Axios 请求客户端
├── types.ts           # 通用类型定义
├── agent/             # Agent 模块
├── core/              # 核心模块（认证/菜单/用户）
├── common/            # 通用接口
├── dashboard/         # 仪表盘
├── education/         # 教育模块
├── education-admin/   # 教育管理
├── knowledge/         # 知识库
├── record/            # 成长记录
└── system/            # 系统管理
```

## 二、请求客户端 `request.ts`

使用 Vben Admin 封装的 `requestClient`：

```ts
import { requestClient } from '#/api/request';

// GET 请求
requestClient.get<T>('/url', { params });

// POST 请求
requestClient.post<T>('/url', data);

// PUT 请求
requestClient.put<T>('/url', data);

// DELETE 请求
requestClient.delete<T>('/url');
```

## 三、接口分类规范

### 按模块分组（当前方式）

每个模块一个文件，如 `api/knowledge/point.ts`

```ts
// api/knowledge/point.ts
export namespace KnowledgeApi {
  export interface KnowledgeVO { ... }
  export interface KnowledgeCreateReq { ... }
}

async function getKnowledgePage(params) {
  return requestClient.get<KnowledgeApi.KnowledgeVO[]>(`/knowledge/spaces/${params.spaceId}/points`, { params });
}

async function createKnowledge(data: KnowledgeApi.KnowledgeCreateReq) {
  return requestClient.post(`/knowledge/spaces/${data.spaceId}/points`, data);
}

export { getKnowledgePage, createKnowledge };
```

### 按子域分组（推荐，适应未来规模）

```ts
// api/knowledge/document.ts
// api/knowledge/relation.ts
// api/knowledge/search.ts
// api/knowledge/enterprise.ts
// api/knowledge/index.ts
```

## 四、各模块 API 文件清单

### agent/

| 文件 | 主要接口 | 对应后端 |
| --- | --- | --- |
| `admin.ts` | 创建/更新/删除/分页查询 Agent | AgentController |
| `agent.ts` | Agent 详情、执行、流式执行 | ExecutionController |
| `chat.ts` | 聊天发送、流式聊天、模型选项 | ChatController |
| `graph.ts` | 图配置 CRUD、验证 | GraphController |
| `model.ts` | 模型选项查询 | ModelController |
| `node-type.ts` | 节点类型列表 | NodeTypeController |
| `platform.ts` | 平台配置 | PlatformController |
| `version.ts` | 版本管理（创建/发布/激活/归档/删除） | VersionController |
| `intent-def.ts` | 意图定义 | IntentController |
| `tutor-agent.ts` | 家教 Agent | TutorController |

### education/

| 文件           | 主要接口  |
| -------------- | --------- |
| `analytics.ts` | 学习分析  |
| `chapter.ts`   | 章节 CRUD |
| `course.ts`    | 课程 CRUD |
| `exam.ts`      | 考试相关  |
| `question.ts`  | 题目 CRUD |
| `subject.ts`   | 科目 CRUD |
| `textbook.ts`  | 教材 CRUD |

### education-admin/

| 文件                | 主要接口     |
| ------------------- | ------------ |
| `exam-admin.ts`     | 考试管理     |
| `plan.ts`           | 学习计划管理 |
| `resource.ts`       | 资源管理     |
| `review.ts`         | 审核管理     |
| `student.ts`        | 学生管理     |
| `wrong-question.ts` | 错题管理     |

### knowledge/

| 文件               | 主要接口    |
| ------------------ | ----------- |
| `knowledge.ts`     | 知识库 CRUD |
| `document.ts`      | 文档管理    |
| `relation.ts`      | 知识关系    |
| `index-rebuild.ts` | 索引重建    |

### system/

| 文件           | 主要接口         |
| -------------- | ---------------- |
| `auth-code.ts` | 授权码管理       |
| `dict.ts`      | 数据字典         |
| `menu.ts`      | 菜单管理         |
| `role.ts`      | 角色管理         |
| `tenant.ts`    | 租户管理         |
| `upload.ts`    | 文件上传         |
| `user.ts`      | 用户管理         |
| `tenant.ts`    | 租户与子租户范围 |

### record/

| 文件          | 主要接口 |
| ------------- | -------- |
| `media.ts`    | 媒体记录 |
| `profile.ts`  | 个人档案 |
| `records.ts`  | 成长记录 |
| `tag.ts`      | 标签管理 |
| `timeline.ts` | 时间线   |

### core/

| 文件      | 主要接口           |
| --------- | ------------------ |
| `auth.ts` | 登录/登出/令牌刷新 |
| `menu.ts` | 菜单获取           |
| `user.ts` | 用户信息           |

## 五、流式接口规范

流式接口统一使用 `fetch + ReadableStream`：

```ts
async function chatStream(
  data: ChatRequest,
  onMessage: (text: string) => void,
): Promise<void> {
  const response = await fetch(
    `${baseURL}/generations/${generationId}/events?afterSeq=-1`,
    {
      body: JSON.stringify(data),
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    },
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onMessage(decoder.decode(value, { stream: true }));
  }
}
```

> ⚠️ **注意**：当前流式实现较为基础，缺少统一管理。详见 [STREAMING.md](./STREAMING.md)。

## 六、命名规范

| 项 | 规范 | 示例 |
| --- | --- | --- |
| 请求方法 | `get`/`create`/`update`/`delete` + 业务名 | `getAgentPage`, `createKnowledge` |
| 类型命名空间 | 模块名 + `Api` | `AgentAdminApi`, `KnowledgeApi` |
| 输入类型 | 业务名 + 动词 + `Req` | `AgentCreateReq` |
| 输出类型 | 业务名 + `VO` | `AgentVO` |
| 文件命名 | kebab-case | `index-rebuild.ts` |
