# LiveVote 后端接口文档与 FastAPI 生成提示词

本文档包含：
- 客户端（`services/api.ts`）期望的 REST 接口契约（路径、方法、请求/响应示例）。
- 快速的 cURL 示例。
- 一份用于生成 Python FastAPI 服务的提示词（中/英双语），可直接粘贴到代码生成器或 ChatGPT 以生成后端实现。

> 注意：客户端在运行时会根据 `localStorage` 中 `livevote_useMock` 的值选择本地 mock（使用 `localStorage`）或调用真实后端；后端基地址由 `livevote_apiBase` 控制（示例默认 `http://localhost:8000`）。

---

## 数据模型（重点）

- Poll

```
{
  "id": "string",
  "title": "string",
  "options": [
    { "id": "string", "text": "string" }
  ],
  "createdAt": 1672531200000,
  "isActive": true
}
```

注意：后端 API 在返回 Poll 数据时会动态计算并添加每个选项的票数（count 字段），但在存储时不保存该字段。

- QRToken

```
{
  "token": "string",
  "pollId": "string",
  "status": "active" | "scanned" | "used",
  "createdAt": 1672531200000
}
```

---

## 全局返回格式

客户端期望后端响应为 JSON 包装结构（以便兼容当前前端实现）：

```
{ "success": boolean, "data"?: any, "error"?: string }
```

注：服务也应设置合适的 HTTP 状态码（200/201/400/404/500），但返回体建议包含上述结构以便客户端解析。

---

## API 端点清单

- GET /api/polls
- POST /api/polls
- GET /api/polls/{poll_id}
- DELETE /api/polls/{poll_id}
- POST /api/polls/{poll_id}/tokens
- GET /api/tokens/{token}
- POST /api/tokens/{token}/scanned
- POST /api/polls/{poll_id}/vote

- 功能与约束:
  - Poll 包含 id/title/options(created with id/text)/createdAt/isActive。
  - 后端通过聚合 votes 集合动态计算每个选项的票数，不再在 polls 集合中存储冗余的 count 字段。
  - Token 生命周期：active -> scanned -> used。投票时 token 必须存在且未 used，投票后将 token 标记为 used。
  - 删除 poll 时同时删除其 tokens 和 votes 关联数据。

- 存储: 使用 mongodb，并提供一个简单的初始化脚本。

- 响应格式: 返回 JSON 包裹结构 {"success": bool, "data"?: ..., "error"?: str}，并在适当的时候设置 HTTP 状态码；在文档中给出示例请求/响应。

---

## Endpoints

Base URL: `{API_BASE}`（例如 `http://localhost:8000`）

1) GET /api/polls

- 描述：获取所有投票活动，按 `createdAt` 降序。
- 请求：无
- 成功响应：

```
{ "success": true, "data": Poll[] }
```

2) POST /api/polls

- 描述：创建一个新活动。
- 请求体 (application/json)：

```
{ "title": "活动标题", "options": ["选项A", "选项B"] }
```

- 成功响应：

```
{ "success": true, "data": Poll }
```

3) GET /api/polls/{pollId}

- 描述：获取指定活动详情（包含 options 与计数）。
- 成功响应：

```
{ "success": true, "data": Poll }
```

4) DELETE /api/polls/{pollId}

- 描述：删除活动，并移除其关联的 tokens 与 votes。
- 成功响应：

```
{ "success": true, "data": true }
```

5) POST /api/polls/{pollId}/tokens

- 描述：为指定活动生成一次性扫码 token（返回 token 字符串）。
- 成功响应：

```
{ "success": true, "data": "tokenString" }
```

6) GET /api/tokens/{token}

- 描述：获取 token 状态与关联信息。
- 成功响应：

```
{ "success": true, "data": QRToken }
```

7) POST /api/tokens/{token}/scanned

- 描述：标记 token 为 `scanned`（扫码事件）。
- 成功响应：

```
{ "success": true, "data": true }
```

8) POST /api/polls/{pollId}/vote

- 描述：提交一次投票（需要 token）。
- 请求体 (application/json)：

```
{ "optionId": "opt_123", "token": "..." }
```

- 成功响应：

```
{ "success": true, "data": true }
```

- 失败示例（令牌无效或已使用）：

```
{ "success": false, "error": "投票失败：令牌无效或已使用" }
```

---

## cURL 示例

创建活动：

```
curl -X POST {API_BASE}/api/polls -H "Content-Type: application/json" -d '{"title":"示例活动","options":["A","B","C"]}'
```

生成 token：

```
curl -X POST {API_BASE}/api/polls/{pollId}/tokens
```

投票：

```
curl -X POST {API_BASE}/api/polls/{pollId}/vote -H "Content-Type: application/json" -d '{"optionId":"opt_123","token":"<token>"}'
```

删除活动：

```
curl -X DELETE {API_BASE}/api/polls/{pollId}
```

---

## FastAPI 生成提示词（中文）

请把下面的提示词直接复制到 ChatGPT 或代码生成器中，用于生成一个可运行的 Python FastAPI 服务骨架：

```
请生成一个使用 Python FastAPI 的后端服务，满足以下契约（用于 LiveVote 前端）：

- Endpoints:
  - GET /api/polls
  - POST /api/polls
  - GET /api/polls/{poll_id}
  - DELETE /api/polls/{poll_id}
  - POST /api/polls/{poll_id}/tokens
  - GET /api/tokens/{token}
  - POST /api/tokens/{token}/scanned
  - POST /api/polls/{poll_id}/vote

- 功能与约束:
  - Poll 包含 id/title/options(created with id/text)/createdAt/isActive。
  - Token 生命周期：active -> scanned -> used。投票时 token 必须存在且未 used，投票后将 token 标记为 used 并给对应 option 的 count +1。
  - 删除 poll 时同时删除其 tokens 和 votes 关联数据。

- 存储: 使用 mongodb，并提供一个简单的初始化脚本。

- 响应格式: 返回 JSON 包裹结构 {"success": bool, "data"?: ..., "error"?: str}，并在适当的时候设置 HTTP 状态码；在文档中给出示例请求/响应。

- 要求:
  - 提供完整文件（如 main.py, models.py 或 将模型放到 main.py 中也可）、requirements.txt、README.md（包含如何用 uvicorn 启动与如何运行迁移/初始化数据库的说明）、以及每个 endpoint 的 curl 示例。

请输出可直接运行的代码片段文件，不要只给思路。
```
