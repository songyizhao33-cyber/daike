# 快速部署指南

## 一键部署

```bash
# 1. 确保在项目根目录
cd D:\代课匹配

# 2. 提交所有更改
git add .
git commit -m "修复：服务器错误、密码加密、操作流程优化、个人信息编辑

- 修复注册时的服务器错误和验证问题
- 添加密码 SHA256 哈希传输保护
- 重构空闲时间管理为分步骤向导式设计
- 添加个人信息编辑功能
- 优化用户体验和错误提示

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 3. 推送到 GitHub
git push origin main

# 4. 等待 Render 自动部署（约 5-10 分钟）
```

## 部署后必做检查

### 1. 基础功能（2分钟）
```
✓ 打开应用 URL
✓ 注册新账号
✓ 登录
✓ 查看首页四个功能卡片
```

### 2. 新功能验证（5分钟）
```
✓ 管理空闲时间 - 测试分步骤流程
✓ 个人中心 - 点击"编辑资料"并保存
✓ 约饭功能 - 发布一条约饭信息
✓ 浏览器开发者工具 - 检查密码是否为哈希值
```

### 3. 移动端测试（3分钟）
```
✓ 手机浏览器打开
✓ 测试登录和注册
✓ 测试课程表选择
```

## 如果遇到问题

### 问题1: 构建失败
```bash
# 检查 Render 构建日志
# 确认 Build Command:
cd frontend && npm install && npm run build && cd ../backend && npm install
```

### 问题2: 运行时错误
```bash
# 检查环境变量
PORT=10000
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=你的密钥
```

### 问题3: 功能异常
```bash
# 清除浏览器缓存
# 检查浏览器控制台错误
# 查看 Render 运行日志
```

## 数据库迁移（如需要）

如果有旧数据，建议清空重新开始：
```javascript
// MongoDB Shell 或 Compass
db.availabilities.deleteMany({})
db.matchrequests.deleteMany({})
```

## 完成！

部署成功后，你的应用将包含：
- ✅ 移动端优化
- ✅ 校区和频率选择
- ✅ 约饭功能
- ✅ 密码加密传输
- ✅ 个人信息编辑
- ✅ 优化的操作流程

## 文档索引

- `BUGFIX_REPORT.md` - 本次修复的详细说明
- `UPDATE_SUMMARY.md` - 之前更新的功能说明
- `DEPLOYMENT_CHECKLIST.md` - 完整的部署检查清单
- `DEPLOYMENT.md` - 部署架构说明
- `CLAUDE.md` - 项目技术文档
