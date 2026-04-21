# Nginx 配置

<cite>
**本文档引用的文件**
- [nginx.conf](file://scripts/deploy/nginx.conf)
- [Dockerfile](file://scripts/deploy/Dockerfile)
- [build-local-docker-image.sh](file://scripts/deploy/build-local-docker-image.sh)
- [vite.config.ts](file://apps/web-naive/vite.config.ts)
- [common.ts](file://internal/vite-config/src/config/common.ts)
- [package.json](file://package.json)
</cite>

## 目录

1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

本文档为 shiyu-ui 项目的 Nginx 服务器配置提供了全面的技术指导。该配置针对现代 Web 应用程序进行了优化，重点关注静态文件服务、反向代理、安全配置和性能优化。项目采用 Vite 构建系统，通过 Docker 容器化部署，使用 Nginx 作为生产环境的 Web 服务器。

shiyu-ui 是一个基于 Vue 3、Vite 和 TypeScript 的现代化前端模板，支持多主题、国际化和权限管理等功能。本文档将详细解释如何配置 Nginx 以提供高性能的静态内容服务和 API 反向代理。

## 项目结构

该项目采用 Monorepo 结构，包含多个应用程序和共享包。Nginx 配置主要服务于 web-naive 应用程序，该应用使用 Vite 进行构建。

```mermaid
graph TB
subgraph "项目结构"
A[根目录] --> B[apps/web-naive]
A --> C[internal]
A --> D[packages]
A --> E[scripts/deploy]
A --> F[playground]
B --> G[Vite 配置]
B --> H[源代码]
B --> I[public 目录]
E --> J[Nginx 配置]
E --> K[Dockerfile]
E --> L[构建脚本]
C --> M[Vite 配置包]
C --> N[工具包]
end
```

**图表来源**

- [package.json:27-66](file://package.json#L27-L66)
- [nginx.conf:49-75](file://scripts/deploy/nginx.conf#L49-L75)

**章节来源**

- [package.json:1-110](file://package.json#L1-L110)
- [nginx.conf:1-76](file://scripts/deploy/nginx.conf#L1-L76)

## 核心组件

### Nginx 配置文件结构

项目中的 Nginx 配置位于 `scripts/deploy/nginx.conf`，包含了完整的服务器配置。该配置文件采用了模块化的结构设计，支持静态文件服务、CORS 处理和错误页面管理。

### Docker 集成配置

Dockerfile 将 Nginx 配置与构建产物集成，实现了完整的容器化部署流程。配置中包含了多阶段构建，优化了镜像大小和构建效率。

### Vite 构建配置

web-naive 应用程序使用 Vite 进行开发和生产构建，配置了代理服务器以支持 API 开发调试。构建输出被复制到 Nginx 的 HTML 目录中。

**章节来源**

- [nginx.conf:17-75](file://scripts/deploy/nginx.conf#L17-L75)
- [Dockerfile:23-39](file://scripts/deploy/Dockerfile#L23-L39)
- [vite.config.ts:1-21](file://apps/web-naive/vite.config.ts#L1-L21)

## 架构概览

shiyu-ui 项目的 Nginx 部署架构采用容器化设计，实现了开发、测试和生产的统一配置管理。

```mermaid
graph TB
subgraph "客户端访问层"
A[浏览器客户端]
B[移动设备]
C[API 客户端]
end
subgraph "负载均衡层"
D[Nginx 服务器]
E[反向代理]
F[CORS 处理]
end
subgraph "应用层"
G[静态资源服务]
H[SPA 路由处理]
I[API 反向代理]
end
subgraph "后端服务层"
J[业务 API 服务器]
K[数据库服务]
L[缓存服务]
end
A --> D
B --> D
C --> D
D --> G
D --> H
D --> I
I --> J
G --> L
H --> L
```

**图表来源**

- [nginx.conf:49-75](file://scripts/deploy/nginx.conf#L49-L75)
- [vite.config.ts:8-16](file://apps/web-naive/vite.config.ts#L8-L16)

### 静态文件服务架构

静态文件服务是 Nginx 的核心功能之一，负责提供构建后的前端资源。配置中包含了 MIME 类型设置、文件缓存策略和错误页面处理。

### 反向代理架构

反向代理功能支持 API 请求转发和 WebSocket 通信。配置中包含了代理规则、超时设置和健康检查机制。

## 详细组件分析

### MIME 类型配置分析

Nginx 配置文件中包含了关键的 MIME 类型设置，确保浏览器正确识别和处理各种文件类型。

```mermaid
classDiagram
class MimeTypes {
+application/javascript js mjs
+text/css css
+text/html html
+default_type application/octet-stream
+include mime.types
}
class StaticFiles {
+root /usr/share/nginx/html
+try_files $uri $uri/ /index.html
+index index.html
}
class CacheControl {
+Cache-Control : public, max-age=31536000, immutable
+ETag : generated
+Last-Modified : generated
}
MimeTypes --> StaticFiles : "提供文件类型识别"
StaticFiles --> CacheControl : "支持缓存策略"
```

**图表来源**

- [nginx.conf:18-25](file://scripts/deploy/nginx.conf#L18-L25)
- [nginx.conf:53-56](file://scripts/deploy/nginx.conf#L53-L56)

#### MIME 类型配置要点

配置文件中明确设置了以下 MIME 类型映射：

- JavaScript 文件：application/javascript (js, mjs)
- CSS 文件：text/css (css)
- HTML 文件：text/html (html)

这些设置确保了浏览器能够正确解析和执行静态资源。

**章节来源**

- [nginx.conf:18-25](file://scripts/deploy/nginx.conf#L18-L25)

### CORS 配置分析

CORS（跨域资源共享）配置是现代 Web 应用的重要安全特性，允许不同域名之间的资源访问。

```mermaid
sequenceDiagram
participant Client as 客户端
participant Nginx as Nginx 服务器
participant API as API 服务器
Client->>Nginx : 发送预检请求 (OPTIONS)
Nginx->>Nginx : 检查 CORS 头部
Nginx->>Client : 返回预检响应
Note over Nginx,Client : Access-Control-Max-Age : 1728000
Client->>Nginx : 发送实际请求
Nginx->>Nginx : 添加 CORS 头部
Nginx->>Client : 返回允许跨域的响应
Note over Nginx,Client : Access-Control-Allow-Origin : *
```

**图表来源**

- [nginx.conf:57-66](file://scripts/deploy/nginx.conf#L57-L66)

#### CORS 配置细节

配置中包含了完整的 CORS 支持：

- 允许所有域名访问：Access-Control-Allow-Origin: \*
- 支持的 HTTP 方法：GET, POST, OPTIONS
- 允许的自定义头部：DNT, X-CustomHeader, Keep-Alive 等
- 预检请求缓存时间：1728000 秒

**章节来源**

- [nginx.conf:57-66](file://scripts/deploy/nginx.conf#L57-L66)

### 错误页面配置分析

错误页面配置提供了用户友好的错误体验，并支持不同类型的服务器错误。

```mermaid
flowchart TD
A[请求处理] --> B{是否成功}
B --> |是| C[返回正常响应]
B --> |否| D[检查错误类型]
D --> E{HTTP 错误码}
E --> |500| F[返回 500 错误页面]
E --> |502| G[返回 502 错误页面]
E --> |503| H[返回 503 错误页面]
E --> |504| I[返回 504 错误页面]
F --> J[50x.html]
G --> J
H --> J
I --> J
J --> K[从 /usr/share/nginx/html 返回]
K --> L[用户看到错误页面]
```

**图表来源**

- [nginx.conf:69-73](file://scripts/deploy/nginx.conf#L69-L73)

#### 错误页面配置要点

配置中定义了以下错误页面：

- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

所有错误页面都指向 `/50x.html`，并从 `/usr/share/nginx/html` 目录提供。

**章节来源**

- [nginx.conf:69-73](file://scripts/deploy/nginx.conf#L69-L73)

### 反向代理配置分析

反向代理配置支持 API 请求转发和 WebSocket 通信，是现代 Web 应用的重要功能。

```mermaid
sequenceDiagram
participant Client as 客户端
participant Nginx as Nginx 服务器
participant Proxy as 代理服务器
participant API as API 服务器
Client->>Nginx : 请求 /api/*
Nginx->>Nginx : 匹配代理规则
Nginx->>Proxy : 转发到 http : //localhost : 9000
Proxy->>API : 转发原始请求
API-->>Proxy : 返回 API 响应
Proxy-->>Nginx : 返回响应
Nginx-->>Client : 返回最终响应
Note over Client,Nginx : 支持 WebSocket 通信
```

**图表来源**

- [vite.config.ts:8-16](file://apps/web-naive/vite.config.ts#L8-L16)

#### 反向代理配置细节

开发环境中的代理配置：

- 代理前缀：/api
- 目标服务器：http://localhost:9000
- 路径重写：移除 /api 前缀
- 支持 WebSocket：ws: true
- 更改源主机：changeOrigin: true

**章节来源**

- [vite.config.ts:8-16](file://apps/web-naive/vite.config.ts#L8-L16)

### 缓存策略配置分析

缓存策略对于提升 Web 应用性能至关重要，涉及静态资源缓存和 API 缓存两个方面。

```mermaid
flowchart TD
A[请求静态资源] --> B{资源类型}
B --> |JavaScript/CSS| C[设置长期缓存]
B --> |HTML| D[禁用缓存或短期缓存]
B --> |图片/字体| E[设置长期缓存]
C --> F[Cache-Control: public, max-age=31536000, immutable]
D --> G[Cache-Control: no-cache]
E --> F
F --> H[ETag: 生成唯一标识符]
G --> I[Last-Modified: 文件修改时间]
H --> J[浏览器缓存命中]
I --> J
J --> K[减少服务器负载]
J --> L[提升用户体验]
```

**图表来源**

- [nginx.conf:53-56](file://scripts/deploy/nginx.conf#L53-L56)

#### 缓存策略实施

虽然当前配置主要关注静态文件服务，但可以扩展实现更精细的缓存控制：

1. **静态资源缓存**：JavaScript、CSS、图片等文件设置长期缓存
2. **HTML 文件缓存**：通常设置短期缓存或不缓存
3. **API 缓存**：根据数据更新频率设置适当的缓存策略
4. **ETag 支持**：启用实体标签验证缓存有效性

**章节来源**

- [nginx.conf:53-56](file://scripts/deploy/nginx.conf#L53-L56)

## 依赖关系分析

### 构建流程依赖

项目的构建和部署流程涉及多个组件的协同工作，形成了清晰的依赖关系链。

```mermaid
graph LR
A[Vite 构建] --> B[构建产物 dist]
B --> C[Docker 构建]
C --> D[Nginx 配置]
D --> E[容器镜像]
E --> F[生产部署]
G[开发服务器] --> H[Vite 开发代理]
H --> I[API 服务器]
subgraph "开发环境"
G
H
I
end
subgraph "生产环境"
A
C
D
E
F
end
```

**图表来源**

- [Dockerfile:19-30](file://scripts/deploy/Dockerfile#L19-L30)
- [package.json:29](file://package.json#L29)

### 组件耦合度分析

项目中的组件设计遵循低耦合高内聚的原则：

- **Nginx 配置**：独立于应用程序逻辑，专注于静态文件服务
- **Docker 配置**：封装了完整的部署流程，便于环境一致性
- **Vite 配置**：分离了开发和生产环境的不同需求
- **构建脚本**：提供了自动化部署流程

**章节来源**

- [Dockerfile:19-30](file://scripts/deploy/Dockerfile#L19-L30)
- [package.json:29](file://package.json#L29)

## 性能考虑

### Gzip 压缩配置

Gzip 压缩是提升 Web 应用性能的重要技术，可以显著减少传输数据量。

```mermaid
flowchart TD
A[启用 Gzip 压缩] --> B[配置压缩缓冲区]
B --> C[设置压缩级别]
C --> D[指定压缩文件类型]
D --> E[启用 vary 头部]
B --> F[gzip_buffers: 32 16k]
C --> G[gzip_comp_level: 6]
D --> H[gzip_types: text/plain, text/css, application/javascript, application/json]
E --> I[gzip_vary: on]
F --> J[优化内存使用]
G --> K[平衡压缩比和 CPU 使用]
H --> L[覆盖常见文本类型]
I --> M[支持压缩协商]
```

**图表来源**

- [nginx.conf:33-47](file://scripts/deploy/nginx.conf#L33-L47)

#### Gzip 配置建议

虽然当前配置注释掉了 Gzip 功能，但推荐启用以下配置：

1. **压缩缓冲区**：32 个 16KB 缓冲区
2. **压缩级别**：6（平衡压缩比和性能）
3. **压缩文件类型**：文本、CSS、JavaScript、JSON
4. **Vary 头部**：支持压缩协商

### 连接池和并发处理

Nginx 的事件模型和连接处理能力直接影响服务器性能。

```mermaid
classDiagram
class WorkerProcesses {
+worker_processes 1
+自动适应 CPU 核心数
+可配置为 auto
}
class WorkerConnections {
+worker_connections 1024
+可根据硬件调整
+考虑峰值并发需求
}
class EventModel {
+epoll (Linux)
+kqueue (BSD/MacOS)
+select (兼容性)
}
WorkerProcesses --> WorkerConnections : "影响并发处理能力"
WorkerConnections --> EventModel : "选择合适的事件模型"
```

**图表来源**

- [nginx.conf:3](file://scripts/deploy/nginx.conf#L3)
- [nginx.conf:13](file://scripts/deploy/nginx.conf#L13)

#### 并发处理优化

1. **工作进程数量**：建议设置为 CPU 核心数
2. **连接数限制**：根据服务器硬件和预期流量调整
3. **事件模型选择**：Linux 系统推荐 epoll
4. **keepalive 超时**：合理设置保持连接时间

**章节来源**

- [nginx.conf:3](file://scripts/deploy/nginx.conf#L3)
- [nginx.conf:13](file://scripts/deploy/nginx.conf#L13)

### 静态文件优化

静态文件服务是 Nginx 的核心功能，需要特别关注性能优化。

```mermaid
flowchart TD
A[静态文件请求] --> B{文件是否存在}
B --> |是| C[直接返回文件]
B --> |否| D[检查 SPA 路由]
D --> E{是否为 SPA 路由}
E --> |是| F[返回 index.html]
E --> |否| G[返回 404]
C --> H[sendfile 优化]
F --> I[SPA 路由处理]
G --> J[404 错误处理]
H --> K[零拷贝传输]
I --> L[支持单页应用]
J --> M[标准错误处理]
```

**图表来源**

- [nginx.conf:53-56](file://scripts/deploy/nginx.conf#L53-L56)

#### 静态文件优化要点

1. **sendfile 优化**：启用 sendfile 提升文件传输性能
2. **SPA 路由支持**：通过 try_files 实现单页应用路由
3. **文件缓存**：合理设置缓存策略减少重复请求
4. **压缩支持**：启用 Gzip 压缩减少传输体积

**章节来源**

- [nginx.conf:53-56](file://scripts/deploy/nginx.conf#L53-L56)

## 故障排除指南

### 常见问题诊断

```mermaid
flowchart TD
A[问题出现] --> B{问题类型}
B --> |静态文件无法加载| C[检查文件路径]
B --> |CORS 错误| D[检查 CORS 配置]
B --> |代理失败| E[检查代理设置]
B --> |性能问题| F[检查缓存配置]
C --> G[确认文件存在]
C --> H[检查权限设置]
C --> I[验证 MIME 类型]
D --> J[检查 Origin 头部]
D --> K[验证允许的方法]
D --> L[确认预检缓存]
E --> M[检查目标服务器]
E --> N[验证代理规则]
E --> O[测试网络连通性]
F --> P[检查缓存头设置]
F --> Q[验证压缩配置]
F --> R[监控性能指标]
```

#### 静态文件问题排查

1. **文件路径检查**：确认静态文件存在于 `/usr/share/nginx/html` 目录
2. **权限验证**：确保 Nginx 用户具有读取权限
3. **MIME 类型验证**：检查文件扩展名与 MIME 类型匹配
4. **缓存清理**：清除浏览器缓存重新测试

#### CORS 问题排查

1. **Origin 头部检查**：验证客户端发送的 Origin 头部
2. **允许方法验证**：确认请求的 HTTP 方法在允许列表中
3. **预检请求测试**：检查 OPTIONS 预检请求的响应
4. **缓存时间验证**：确认 Access-Control-Max-Age 设置正确

#### 代理问题排查

1. **目标服务器状态**：验证 API 服务器是否正常运行
2. **网络连通性**：检查防火墙和网络配置
3. **代理规则验证**：确认代理路径和目标地址正确
4. **WebSocket 支持**：验证 WebSocket 代理配置

**章节来源**

- [nginx.conf:57-66](file://scripts/deploy/nginx.conf#L57-L66)
- [vite.config.ts:8-16](file://apps/web-naive/vite.config.ts#L8-L16)

### 日志配置和监控

```mermaid
flowchart TD
A[日志配置] --> B[错误日志]
A --> C[访问日志]
A --> D[自定义日志格式]
B --> E[error_log /var/log/nginx/error.log]
B --> F[level notice/info/warn/error]
C --> G[access_log /var/log/nginx/access.log]
C --> H[默认格式]
C --> I[自定义格式]
D --> J[结合业务需求]
D --> K[性能监控]
D --> L[安全审计]
E --> M[调试问题]
G --> N[分析流量]
J --> O[业务洞察]
```

#### 日志配置建议

1. **错误日志**：配置适当的日志级别以便问题诊断
2. **访问日志**：记录重要的访问信息用于分析
3. **自定义格式**：根据业务需求定制日志格式
4. **轮转策略**：设置日志文件大小和保留策略

**章节来源**

- [nginx.conf:5](file://scripts/deploy/nginx.conf#L5)

## 结论

shiyu-ui 项目的 Nginx 配置展现了现代 Web 应用部署的最佳实践。通过容器化部署、模块化配置和性能优化，实现了高效稳定的静态文件服务和 API 反向代理。

### 关键优势

1. **容器化部署**：Docker 多阶段构建确保了环境一致性和部署效率
2. **模块化配置**：清晰的配置结构便于维护和扩展
3. **性能优化**：合理的缓存策略和压缩配置提升了用户体验
4. **安全考虑**：完整的 CORS 支持和错误页面处理增强了安全性

### 改进建议

1. **启用 Gzip 压缩**：提升静态资源传输性能
2. **优化缓存策略**：针对不同类型资源设置合适的缓存时间
3. **增强安全配置**：添加 HTTPS 支持和安全头部
4. **监控和日志**：完善日志记录和性能监控机制

该配置为 shiyu-ui 项目提供了坚实的技术基础，能够满足生产环境的高性能要求，同时保持了良好的可维护性和扩展性。
