# Render 部署指南

## 部署方式

您**不需要**手动上传代码到 Render。Render 支持直接从 GitHub 仓库部署。

## 部署步骤

### 1. 准备 GitHub 仓库

首先，将代码推送到 GitHub：

```bash
cd "D:\代课匹配"

# 如果还没有初始化 git
git init

# 添加所有文件
git add .

# 创建提交
git commit -m "完整功能实现：代课匹配、约饭、塔罗牌、信箱、回访"

# 在 GitHub 创建新仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到 GitHub
git push -u origin main
```

### 2. 在 Render 创建 Web Service

1. 登录 [Render](https://render.com/)
2. 点击 "New +" → "Web Service"
3. 连接您的 GitHub 仓库
4. 选择刚才创建的仓库

### 3. 配置 Web Service

填写以下配置：

**基本设置：**
- **Name**: `substitute-matching`（或您喜欢的名称）
- **Region**: 选择离您最近的区域
- **Branch**: `main`
- **Root Directory**: 留空（使用根目录）
- **Runtime**: `Node`
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```
- **Start Command**:
  ```bash
  cd backend && node server.js
  ```

**环境变量（Environment Variables）：**

点击 "Advanced" → "Add Environment Variable"，添加以下变量：

```
PORT=3000
MONGODB_URI=mongodb+srv://songyizhao33_db_user:8L0vc0KqC9zza3tf@cluster0.trauptu.mongodb.net/substitute-matching?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
NODE_ENV=production
```

**重要提示：**
- 建议更改 `JWT_SECRET` 为一个更安全的随机字符串
- 确保 MongoDB Atlas 允许 Render 的 IP 访问（建议允许所有 IP：0.0.0.0/0）

### 4. 部署

1. 点击 "Create Web Service"
2. Render 会自动开始构建和部署
3. 等待部署完成（通常需要 5-10 分钟）
4. 部署成功后，您会看到一个 URL，例如：`https://substitute-matching.onrender.com`

### 5. 初始化塔罗牌数据

部署成功后，需要初始化塔罗牌数据。有两种方式：

**方式一：通过 API（推荐）**

访问：`https://你的应用.onrender.com/api/tarot/initialize`

需要先登录并获取管理员 token，然后在请求头中添加：
```
Authorization: Bearer your_token_here
```

**方式二：通过 Render Shell**

1. 在 Render 控制台，进入您的 Web Service
2. 点击 "Shell" 标签
3. 运行：
   ```bash
   cd backend && node scripts/initTarot.js
   ```

### 6. 配置 MongoDB Atlas IP 白名单

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
2. 进入您的集群
3. 点击 "Network Access"
4. 点击 "Add IP Address"
5. 选择 "Allow Access from Anywhere" (0.0.0.0/0)
6. 点击 "Confirm"

**注意：** 在生产环境中，建议只允许 Render 的 IP 地址访问。

## 更新部署

每次推送代码到 GitHub 的 main 分支，Render 会自动重新部署：

```bash
git add .
git commit -m "更新说明"
git push origin main
```

## 常见问题

### 1. 部署失败：MongoDB 连接错误

**解决方案：**
- 检查 MongoDB Atlas 的 IP 白名单设置
- 确认 `MONGODB_URI` 环境变量正确
- 检查 MongoDB Atlas 集群是否正常运行

### 2. 前端页面 404

**解决方案：**
- 确认构建命令正确执行
- 检查 `frontend/dist` 目录是否生成
- 确认 `server.js` 中的静态文件配置正确

### 3. API 请求失败

**解决方案：**
- 检查前端是否使用相对路径 `/api`
- 确认后端路由正确注册
- 查看 Render 日志排查错误

## 查看日志

在 Render 控制台：
1. 进入您的 Web Service
2. 点击 "Logs" 标签
3. 查看实时日志

## 本地测试生产构建

在部署前，建议本地测试：

```bash
# 构建前端
cd frontend
npm run build

# 启动后端（会同时提供前端静态文件）
cd ../backend
npm start
```

访问 `http://localhost:3000` 测试。

## 性能优化建议

1. **启用 Gzip 压缩**：在 `server.js` 中添加 compression 中间件
2. **CDN 加速**：考虑使用 Cloudflare 等 CDN
3. **数据库索引**：确保所有查询都有适当的索引
4. **缓存策略**：为静态资源设置缓存头

## 安全建议

1. **更改默认密钥**：修改 `JWT_SECRET` 为强随机字符串
2. **HTTPS**：Render 自动提供 HTTPS
3. **限流**：考虑添加 rate limiting 中间件
4. **输入验证**：确保所有用户输入都经过验证
5. **MongoDB 安全**：使用强密码，限制 IP 访问

## 监控和维护

1. **定期备份**：MongoDB Atlas 提供自动备份
2. **监控日志**：定期检查 Render 日志
3. **性能监控**：使用 Render 的监控功能
4. **更新依赖**：定期更新 npm 包

## 成本

Render 免费套餐限制：
- 服务会在 15 分钟无活动后休眠
- 每月 750 小时免费运行时间
- 首次访问可能需要等待服务唤醒（约 30 秒）

如需 24/7 运行，考虑升级到付费套餐（$7/月起）。
