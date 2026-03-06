# 部署指南

## 最新更新（2026-03-06）

### 新增功能
1. **移动端响应式优化** - 所有页面现在在手机端都能良好显示
2. **校区选择功能** - 发布需求和空闲时间时可以选择校区（邯郸、枫林、江湾、张江）
3. **频率类型选择** - 可以选择长期、短期或单次
4. **约饭功能** - 全新的约饭模块，用户可以发布约饭信息并浏览他人的约饭需求

### 数据库迁移注意事项

由于数据模型更新，建议清空现有数据或手动迁移：
- `Availability` 模型新增 `campuses` 和 `frequencyType` 字段
- `MatchRequest` 模型新增 `campus` 和 `frequencyType` 字段
- 新增 `MealAppointment` 模型

## 问题诊断

之前的部署问题：
1. 前后端分离部署导致 CORS 问题
2. 静态站点无法处理 SPA 路由（刷新页面 404）
3. API 路径配置不一致

## 解决方案

现在采用**单服务部署**：后端服务器同时提供 API 和前端静态文件。

## Render 部署步骤

### 1. 删除旧服务

在 Render Dashboard 中：
- 删除 `daike-frontend` 服务
- 删除 `daike-backend` 服务

### 2. 创建新服务

1. 点击 "New +" → "Web Service"
2. 连接你的 GitHub 仓库
3. 配置如下：

**基本设置：**
- Name: `daike`
- Region: `Singapore`
- Branch: `main`
- Root Directory: 留空
- Environment: `Node`
- Build Command:
  ```bash
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```
- Start Command:
  ```bash
  cd backend && npm start
  ```

**环境变量：**
添加以下环境变量：
- `PORT`: `10000`
- `MONGODB_URI`: 你的 MongoDB 连接字符串
- `JWT_SECRET`: 你的 JWT 密钥（随机字符串）

### 3. 部署

点击 "Create Web Service"，Render 会自动构建和部署。

### 4. 访问

部署完成后，访问 Render 提供的 URL（例如 `https://daike.onrender.com`）即可使用应用。

## 本地开发

### 后端
```bash
cd backend
npm install
npm run dev
```

### 前端
```bash
cd frontend
npm install
npm run dev
```

前端开发服务器会通过代理将 `/api` 请求转发到后端。

## 架构说明

- 生产环境：后端服务器（Express）提供 API 和前端静态文件
- 开发环境：前端开发服务器（Vite）+ 后端服务器，通过代理通信
- 所有 API 请求使用相对路径 `/api`，避免跨域问题
