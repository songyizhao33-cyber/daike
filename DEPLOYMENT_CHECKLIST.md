# 部署检查清单 (更新版 - 2026-03-06)

## 新功能概述

本次更新包含：
1. ✅ 移动端响应式优化
2. ✅ 校区选择功能（邯郸、枫林、江湾、张江）
3. ✅ 频率类型选择（长期、短期、单次）
4. ✅ 全新约饭功能

## 部署前准备

- [ ] 确认所有代码已提交到 Git
- [ ] 本地测试通过（前端构建成功）
- [ ] 备份现有数据库数据（重要！）

## Render 部署步骤

### 方式一：自动部署（推荐）
如果已经配置了 GitHub 自动部署：
1. [ ] 将代码推送到 GitHub main 分支
   ```bash
   git add .
   git commit -m "新增：校区选择、频率类型、约饭功能及移动端优化"
   git push origin main
   ```
2. [ ] Render 会自动检测并开始部署
3. [ ] 等待部署完成（约 5-10 分钟）
4. [ ] 访问应用 URL 测试功能

### 方式二：手动部署
如果需要手动触发：
1. [ ] 登录 Render Dashboard
2. [ ] 找到你的服务（如 `daike`）
3. [ ] 点击 "Manual Deploy" → "Deploy latest commit"
4. [ ] 等待部署完成
5. [ ] 访问应用 URL 测试功能

## 部署后验证

### 基础功能测试
- [ ] 登录/注册功能正常
- [ ] 首页显示正常，四个功能卡片都可见（新增约饭卡片）
- [ ] 管理空闲时间页面正常
- [ ] 寻找代课者页面正常
- [ ] 约饭功能页面正常
- [ ] 个人中心页面正常

### 新功能测试
- [ ] 校区选择功能正常（多选/单选）
- [ ] 频率类型选择功能正常
- [ ] 约饭发布功能正常
- [ ] 约饭浏览功能正常
- [ ] 约饭取消功能正常

### 移动端测试
- [ ] 在手机浏览器打开应用
- [ ] 测试所有页面的显示效果
- [ ] 测试表单输入和提交
- [ ] 测试课程表选择器的操作

### 数据测试
- [ ] 创建测试账号
- [ ] 发布空闲时间（选择校区和频率）
- [ ] 发布代课需求（选择校区和频率）
- [ ] 测试匹配功能
- [ ] 发布约饭信息
- [ ] 浏览约饭信息

## 常见问题排查

### 如果部署失败
1. 检查 Render 的构建日志
2. 确认 Build Command 正确：
   ```
   cd frontend && npm install && npm run build && cd ../backend && npm install
   ```
3. 确认 Start Command 正确：
   ```
   cd backend && npm start
   ```

### 如果页面显示异常
1. 清除浏览器缓存
2. 检查浏览器控制台的错误信息
3. 确认 API 请求是否成功

### 如果数据库连接失败
1. 检查 `MONGODB_URI` 环境变量是否正确
2. 确认 MongoDB 服务是否正常运行
3. 检查 IP 白名单设置（如使用 MongoDB Atlas）

## 数据库迁移（重要！）

由于数据模型有更新，现有数据需要处理：

### 选项 1：清空重新开始（推荐）
```javascript
// 在 MongoDB Shell 或 Compass 中执行
db.availabilities.deleteMany({})
db.matchrequests.deleteMany({})
```

### 选项 2：手动添加默认值
```javascript
// 为现有 availabilities 添加新字段
db.availabilities.updateMany(
  {},
  {
    $set: {
      campuses: ["邯郸"],
      frequencyType: "long-term"
    }
  }
)

// 为现有 matchrequests 添加新字段
db.matchrequests.updateMany(
  {},
  {
    $set: {
      campus: "邯郸",
      frequencyType: "long-term"
    }
  }
)
```

## 环境变量检查

确认以下环境变量已设置：
- [ ] `PORT` = `10000`
- [ ] `MONGODB_URI` = (你的 MongoDB 连接字符串)
- [ ] `JWT_SECRET` = (你的 JWT 密钥)

## 部署完成

- [ ] 所有测试通过
- [ ] 通知用户新功能上线
- [ ] 更新用户文档（如有）
- [ ] 监控应用运行状态

## 回滚计划（如需要）

如果新版本有严重问题：
1. 在 Render Dashboard 中找到之前的部署
2. 点击 "Rollback to this version"
3. 等待回滚完成
4. 通知用户

## 参考文档

- `UPDATE_SUMMARY.md` - 详细的更新说明
- `DEPLOYMENT.md` - 部署架构说明
- `CLAUDE.md` - 项目技术文档
