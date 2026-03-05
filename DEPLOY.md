# Render 部署指南

## 问题诊断

你遇到的"请求失败"错误主要是因为前端请求的 API 路径不正确。已修复的问题：

1. **前端 API 基础路径**：修改了 `frontend/src/utils/request.js`，将 baseURL 从 `https://daike.onrender.com` 改为 `https://daike.onrender.com/api`
2. **CORS 配置**：在后端添加了 OPTIONS 方法支持，确保预检请求能通过

## 部署步骤

### 1. 后端部署（已部署在 https://daike.onrender.com）

在 Render 控制台检查以下配置：

**环境变量（Environment Variables）：**
```
PORT=10000
MONGODB_URI=mongodb+srv://songyizhao33_db_user:8L0vc0KqC9zza3tf@cluster0.trauptu.mongodb.net/substitute-matching?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
```

**构建命令（Build Command）：**
```
cd backend && npm install
```

**启动命令（Start Command）：**
```
cd backend && npm start
```

**根目录（Root Directory）：**
留空或设置为 `/`

### 2. 前端部署（已部署在 https://daike-1.onrender.com）

在 Render 控制台检查以下配置：

**服务类型：** Static Site

**环境变量（Environment Variables）：**
```
VITE_API_URL=https://daike.onrender.com/api
```

**构建命令（Build Command）：**
```
cd frontend && npm install && npm run build
```

**发布目录（Publish Directory）：**
```
frontend/dist
```

**根目录（Root Directory）：**
留空或设置为 `/`

### 3. 重新部署

修改代码后，需要重新部署：

1. 提交代码到 GitHub：
```bash
git add .
git commit -m "修复 API 路径和 CORS 配置"
git push origin main
```

2. 在 Render 控制台：
   - 进入后端服务，点击 "Manual Deploy" → "Deploy latest commit"
   - 进入前端服务，点击 "Manual Deploy" → "Deploy latest commit"

### 4. 验证部署

部署完成后：

1. 访问后端健康检查：https://daike.onrender.com/
   - 应该返回：`{"message":"代课匹配系统 API"}`

2. 访问前端：https://daike-1.onrender.com
   - 应该能看到登录页面
   - 尝试注册新用户测试功能

### 5. 常见问题

**问题：前端显示"请求失败"**
- 检查浏览器控制台（F12）的 Network 标签，查看请求的完整 URL
- 确认请求是发送到 `https://daike.onrender.com/api/auth/login` 而不是 `https://daike.onrender.com/auth/login`

**问题：CORS 错误**
- 确认后端 `server.js` 中的 CORS 配置包含了前端的 URL
- 检查是否允许了 OPTIONS 方法

**问题：MongoDB 连接失败**
- 检查 MongoDB Atlas 的网络访问设置，确保允许来自任何 IP（0.0.0.0/0）
- 验证 MONGODB_URI 环境变量是否正确设置

**问题：Render 免费服务休眠**
- Render 免费服务在 15 分钟无活动后会休眠
- 首次访问可能需要等待 30-60 秒唤醒服务
- 可以使用 UptimeRobot 等服务定期 ping 保持活跃

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

本地开发时，前端会通过 Vite 代理将 `/api` 请求转发到 `http://localhost:3000`。

## 安全建议

1. **修改 JWT_SECRET**：在生产环境使用强随机字符串
2. **MongoDB 访问控制**：考虑限制 IP 白名单（虽然 Render 的 IP 可能会变化）
3. **环境变量**：不要将 `.env` 文件提交到 Git
