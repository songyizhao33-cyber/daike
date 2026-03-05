# 快速参考

## 🔗 部署 URL

- **前端：** https://daike-1.onrender.com
- **后端：** https://daike.onrender.com
- **后端 API：** https://daike.onrender.com/api

## 🔧 关键配置

### 前端环境变量（Render）
```
VITE_API_URL=https://daike.onrender.com/api
```

### 后端环境变量（Render）
```
PORT=10000
MONGODB_URI=mongodb+srv://songyizhao33_db_user:8L0vc0KqC9zza3tf@cluster0.trauptu.mongodb.net/substitute-matching?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
```

## 📝 部署命令

### 后端
```bash
# Build Command
cd backend && npm install

# Start Command
cd backend && npm start
```

### 前端
```bash
# Build Command
cd frontend && npm install && npm run build

# Publish Directory
frontend/dist
```

## 🧪 测试命令

```bash
# 测试后端 API
curl https://daike.onrender.com/

# 测试登录接口
curl -X POST https://daike.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🚀 快速部署

```bash
# 1. 提交代码
git add .
git commit -m "修复部署问题"
git push origin main

# 2. 在 Render 控制台手动触发部署
# - 后端：Manual Deploy → Deploy latest commit
# - 前端：Manual Deploy → Deploy latest commit

# 3. 等待部署完成（5-10 分钟）

# 4. 测试访问
# - 前端：https://daike-1.onrender.com
# - 后端：https://daike.onrender.com/
```

## 🐛 常见问题

### 问题：前端显示"请求失败"
**解决：** 检查 Network 标签，确认请求 URL 是 `https://daike.onrender.com/api/...`

### 问题：CORS 错误
**解决：** 确认后端 CORS 配置包含前端 URL 和 OPTIONS 方法

### 问题：前端路由 404
**解决：** 确认 `frontend/public/_redirects` 文件存在

### 问题：服务响应慢
**原因：** Render 免费服务休眠，首次访问需要 30-60 秒唤醒

## 📚 文档

- [FIX_SUMMARY.md](./FIX_SUMMARY.md) - 问题修复总结
- [DEPLOY.md](./DEPLOY.md) - 详细部署指南
- [CHECKLIST.md](./CHECKLIST.md) - 部署检查清单
- [README.md](./README.md) - 项目说明

## 🔐 安全提醒

⚠️ **重要：** 在生产环境中，请修改 `JWT_SECRET` 为强随机字符串！

```bash
# 生成安全的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
