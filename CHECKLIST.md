# 部署检查清单

在重新部署之前，请确认以下配置：

## ✅ 代码修改

- [x] 修改 `frontend/src/utils/request.js` 的 baseURL 为 `https://daike.onrender.com/api`
- [x] 修改 `backend/server.js` 的 CORS 配置，添加 OPTIONS 方法
- [x] 创建 `frontend/public/_redirects` 文件支持 SPA 路由
- [x] 创建 `DEPLOY.md` 部署文档
- [x] 创建 `render.yaml` 配置文件（可选）

## ✅ Render 后端配置

登录 Render 控制台，检查后端服务（daike-backend）：

### 环境变量
- [ ] `PORT` = `10000`
- [ ] `MONGODB_URI` = `mongodb+srv://songyizhao33_db_user:8L0vc0KqC9zza3tf@cluster0.trauptu.mongodb.net/substitute-matching?appName=Cluster0`
- [ ] `JWT_SECRET` = `your_jwt_secret_key_here` （建议修改为更安全的值）

### 构建和启动命令
- [ ] Build Command: `cd backend && npm install`
- [ ] Start Command: `cd backend && npm start`
- [ ] Root Directory: 留空或 `/`

### 其他设置
- [ ] Region: Singapore（或其他区域）
- [ ] Plan: Free
- [ ] Auto-Deploy: 启用（可选）

## ✅ Render 前端配置

检查前端服务（daike-frontend）：

### 环境变量
- [ ] `VITE_API_URL` = `https://daike.onrender.com/api`

### 构建命令
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Publish Directory: `frontend/dist`
- [ ] Root Directory: 留空或 `/`

### 其他设置
- [ ] Service Type: Static Site
- [ ] Region: Singapore（或其他区域）
- [ ] Plan: Free
- [ ] Auto-Deploy: 启用（可选）

## ✅ MongoDB Atlas 配置

登录 MongoDB Atlas，检查数据库配置：

- [ ] Network Access: 允许来自任何 IP（0.0.0.0/0）
- [ ] Database User: 用户名和密码正确
- [ ] Connection String: 与 MONGODB_URI 一致

## ✅ 部署步骤

1. [ ] 提交代码到 GitHub
   ```bash
   git add .
   git commit -m "修复部署问题"
   git push origin main
   ```

2. [ ] 在 Render 控制台手动触发部署
   - [ ] 后端：Manual Deploy → Deploy latest commit
   - [ ] 前端：Manual Deploy → Deploy latest commit

3. [ ] 等待部署完成（可能需要 5-10 分钟）

4. [ ] 测试部署结果

## ✅ 测试清单

部署完成后，进行以下测试：

### 后端测试
- [ ] 访问 https://daike.onrender.com/
  - 应该返回：`{"message":"代课匹配系统 API"}`

- [ ] 测试登录接口（使用 curl 或 Postman）
  ```bash
  curl -X POST https://daike.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  ```
  - 应该返回 JSON 响应（即使是错误响应也说明接口正常）

### 前端测试
- [ ] 访问 https://daike-1.onrender.com
  - 应该能看到登录页面
  - 不应该有 CORS 错误

- [ ] 打开浏览器开发者工具（F12）
  - [ ] Console 标签：检查是否有错误
  - [ ] Network 标签：检查 API 请求是否发送到正确的 URL

- [ ] 尝试注册新用户
  - [ ] 填写表单并提交
  - [ ] 检查是否成功注册

- [ ] 尝试登录
  - [ ] 使用注册的账号登录
  - [ ] 检查是否成功跳转到首页

### 功能测试
- [ ] 代课者功能
  - [ ] 添加空闲时间
  - [ ] 查看空闲时间列表
  - [ ] 删除空闲时间

- [ ] 需求者功能
  - [ ] 发布代课需求
  - [ ] 查看匹配结果
  - [ ] 选择代课者

## 🐛 常见问题排查

如果遇到问题，按以下顺序排查：

1. **前端显示"请求失败"**
   - 打开浏览器开发者工具 → Network 标签
   - 查看失败的请求 URL 是否正确（应该是 `https://daike.onrender.com/api/...`）
   - 查看响应状态码和错误信息

2. **CORS 错误**
   - 检查后端 `server.js` 的 CORS 配置
   - 确认前端 URL 在允许列表中
   - 检查是否允许了 OPTIONS 方法

3. **404 错误**
   - 检查 API 路径是否正确
   - 确认后端路由配置正确
   - 检查 Render 的构建日志

4. **MongoDB 连接失败**
   - 检查 MONGODB_URI 环境变量
   - 确认 MongoDB Atlas 网络访问设置
   - 查看后端日志

5. **前端路由 404**
   - 确认 `_redirects` 文件存在于 `frontend/public/` 目录
   - 检查 Render 的构建日志，确认文件被复制到 dist 目录

## 📝 注意事项

- Render 免费服务在 15 分钟无活动后会休眠，首次访问需要等待唤醒（30-60 秒）
- 修改环境变量后需要手动触发重新部署
- 前端修改需要重新构建才能生效
- 后端修改会自动重启服务（如果启用了 Auto-Deploy）
