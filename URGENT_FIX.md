# 紧急修复：API 请求地址错误

## 问题诊断

从你提供的截图可以看到：
- 请求 URL：`https://daike-1.onrender.com/api/auth/login`（❌ 错误）
- 应该是：`https://daike.onrender.com/api/auth/login`（✅ 正确）

**根本原因：** 前端请求发送到了自己的域名（daike-1），而不是后端的域名（daike）。

## 已修复

修改了 `frontend/src/utils/request.js`，使用更可靠的配置方式：

```javascript
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'https://daike.onrender.com/api',
  timeout: 10000,
  withCredentials: true
})
```

这样：
- **开发环境**（`npm run dev`）：使用 `/api`，通过 Vite 代理转发到 `http://localhost:3000`
- **生产环境**（部署到 Render）：直接使用 `https://daike.onrender.com/api`

## 立即部署

### 1. 提交代码
```bash
git add .
git commit -m "修复：前端 API 请求地址错误"
git push origin main
```

### 2. 重新部署前端

在 Render 控制台：
1. 进入 **daike-front** 服务
2. 点击 **"Manual Deploy"** → **"Deploy latest commit"**
3. 等待部署完成（3-5 分钟）

**注意：** 现在不需要设置 `VITE_API_URL` 环境变量了，代码中已经硬编码了正确的后端地址。

### 3. 清除浏览器缓存

部署完成后：
1. 打开 https://daike-1.onrender.com
2. 按 `Ctrl + Shift + R`（Windows）或 `Cmd + Shift + R`（Mac）强制刷新
3. 或者按 `F12` 打开开发者工具 → 右键点击刷新按钮 → 选择"清空缓存并硬性重新加载"

### 4. 验证修复

1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 尝试登录
4. 检查请求 URL 是否为：`https://daike.onrender.com/api/auth/login`

## 预期结果

修复后，你应该能看到：
- ✅ 请求发送到正确的后端 URL（`https://daike.onrender.com/api/...`）
- ✅ 返回 200 状态码（成功）或 401（用户名密码错误）
- ✅ 能够正常注册和登录

## 如果还有问题

请提供以下信息：
1. 浏览器开发者工具 Network 标签的截图（显示请求 URL 和响应）
2. Console 标签的错误信息截图
3. 确认是否已经清除了浏览器缓存
