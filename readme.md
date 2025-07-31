# Vercel 留言板

这是一个简单的留言板应用，旨在演示如何使用 Vercel Serverless Functions 和 Vercel KV (基于 Upstash Redis) 构建一个全栈应用。

## ✨ 功能

- 发布文本留言
- 记录按钮点击事件
- 使用原生 HTML, CSS, 和 JavaScript 构建的简单前端
- 使用 Vercel Functions 实现的无服务器后端
- 使用 Vercel KV 实现数据持久化存储

## 🚀 技术栈

- **前端:** HTML, CSS, JavaScript (原生)
- **后端:** Vercel Serverless Functions (Node.js)
- **数据库:** Vercel KV (Powered by Upstash Redis)

## 本地开发

按照以下步骤在你的本地环境中运行此项目。

### 1. 克隆仓库

```bash
git clone https://github.com/cnhjp/vercel-guestbook.git
cd vercel-guestbook
```

### 2. 安装依赖

项目使用了 `pnpm`，你也可以使用 `npm` 或 `yarn`。

```bash
pnpm install
```

### 3. 配置 Vercel KV

1.  登录到你的 Vercel 账户。
2.  在 Vercel 控制台创建一个新的 KV 数据库。
3.  将此项目连接到你创建的 KV 数据库。Vercel 会提示你下载 `.env.local` 文件或直接将环境变量注入到项目中。
4.  如果需要手动配置，请在项目根目录创建一个 `.env.local` 文件，并填入从 Vercel KV 数据库设置页面获取的环境变量：

    ```env
    KV_REST_API_URL="YOUR_KV_REST_API_URL"
    KV_REST_API_TOKEN="YOUR_KV_REST_API_TOKEN"
    ```

### 4. 本地运行

使用 Vercel CLI 在本地启动开发服务器。

```bash
vercel dev
```

应用将在 `http://localhost:3000` 上运行。

### 5. 部署到 Vercel

将代码推送到与 Vercel 项目关联的 Git 仓库，Vercel 将会自动部署。或者，你也可以通过 Vercel CLI 手动部署：

```bash
vercel --prod
```

## 📝 API 端点

后端服务由一个位于 `api/guestbook.js` 的 Serverless Function 提供。

### `GET /api/guestbook`

获取所有留言和点击记录。返回一个包含所有记录的 JSON 数组。

### `POST /api/guestbook`

添加一条新记录。请求体需要指定记录的类型。

**请求体示例 (发布留言):**
```json
{
  "type": "message",
  "content": "这是一条留言。"
}
```

**请求体示例 (记录点击):**
```json
{
  "type": "click"
}
```