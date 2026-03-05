# 部署检查清单

## 代码修改完成 ✓

- [x] backend/server.js - 添加静态文件服务和 SPA 路由支持
- [x] frontend/src/utils/request.js - 统一使用 /api 路径
- [x] render.yaml - 合并为单服务部署
- [x] backend/package.json - 添加 build 脚本
- [x] frontend/vite.config.js - 确保 base 路径为 /

## Render 部署步骤

### 第一步：清理旧服务
- [ ] 登录 Render Dashboard (https://dashboard.render.com)
- [ ] 删除 `daike-frontend` 服务（如果存在）
- [ ] 删除 `daike-backend` 服务（如果存在）

### 第二步：提交代码
```bash
git add .
git commit -m "修复：统一部署架构，解决 404 和 CORS 问题"
git push origin main
```

### 第三步：创建新服务
1. 点击 "New +" → "Web Service"
2. 选择你的 GitHub 仓库
3. 配置如下：

**基本信息：**
- Name: `daike`
- Region: `Singapore` (或其他区域)
- Branch: `main`
- Root Directory: (留空)

**构建设置：**
- Environment: `Node`
- Build Command:
  ```
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```
- Start Command:
  ```
  cd backend && npm start
  ```

**环境变量：**
- [ ] `PORT` = `10000`
- [ ] `MONGODB_URI` = (你的 MongoDB 连接字符串)
- [ ] `JWT_SECRET` = (随机生成的密钥，例如：`your_secret_key_12345`)

### 第四步：部署
- [ ] 点击 "Create Web Service"
- [ ] 等待构建完成（约 3-5 分钟）
- [ ] 检查构建日志，确保无错误

### 第五步：验证
访问 Render 提供的 URL（例如 https://daike.onrender.com）：

- [ ] 首页正常加载
- [ ] 可以注册新用户
- [ ] 可以登录
- [ ] 刷新页面不会 404
- [ ] 浏览器控制台无 CORS 错误
- [ ] API 请求正常工作

## 常见问题

### 构建失败
- 检查 Build Command 是否正确
- 查看构建日志中的错误信息
- 确保 package.json 中的依赖正确

### 运行时错误
- 检查环境变量是否正确设置
- 查看运行日志
- 确保 MongoDB 连接字符串有效

### 404 错误
- 确保 backend/server.js 中的静态文件路径正确
- 确保前端已正确构建（dist 目录存在）

### CORS 错误
- 不应该再有 CORS 错误（同源部署）
- 如果仍有问题，检查 request.js 中的 baseURL

## MongoDB 设置

如果还没有 MongoDB 数据库：

1. 访问 https://www.mongodb.com/cloud/atlas
2. 创建免费集群
3. 创建数据库用户
4. 获取连接字符串（格式：`mongodb+srv://username:password@cluster.mongodb.net/dbname`）
5. 将连接字符串添加到 Render 环境变量

## 完成！

部署成功后，你的应用将在单个 URL 下运行，无需担心 CORS 或路由问题。
