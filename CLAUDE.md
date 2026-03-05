# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个代课匹配系统，使用 Vue 3 + Node.js 全栈开发。代课者可以标记空闲时间，需求者可以发布代课需求并自动匹配可用的代课者。

## 技术栈

- 后端：Node.js + Express + MongoDB + Mongoose
- 前端：Vue 3 + Vite + Element Plus + Pinia
- 认证：JWT

## 开发命令

### 后端（backend 目录）
```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器（使用 nodemon）
npm start            # 启动生产服务器
```

### 前端（frontend 目录）
```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器（端口 5173）
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

## 项目架构

### 后端架构
- `models/` - Mongoose 数据模型（User, Availability, MatchRequest）
- `routes/` - Express 路由处理器（auth, availability, match）
- `middleware/` - 中间件（JWT 认证）
- `server.js` - 应用入口

### 前端架构
- `views/` - 页面组件（Login, Register, Home, Availability, Match）
- `stores/` - Pinia 状态管理（user store）
- `router/` - Vue Router 路由配置
- `utils/request.js` - Axios 封装，包含请求拦截器

### 数据模型

**User（用户）**
- username, password（bcrypt 加密）
- role: substitute（代课者）| requester（需求者）| both
- profile: gender, major, grade, phone, email

**Availability（空闲时间）**
- userId, date, startTime, endTime
- isRecurring（是否长期重复）
- recurringDays（重复的星期几，0-6）
- status: available | booked | cancelled

**MatchRequest（匹配请求）**
- requesterId, date, startTime, endTime
- courseInfo（课程信息）
- filters（筛选条件：gender, major, grade）
- matchedSubstitutes（匹配到的代课者数组）
- selectedSubstitute（选中的代课者）
- status: pending | matched | completed | cancelled

### 匹配逻辑

匹配算法位于 `backend/routes/match.js`：
1. 查找指定日期和时间段内的空闲时间记录
2. 同时查找长期重复且匹配星期几的记录
3. 根据 filters（性别、专业、年级）过滤代课者
4. 返回匹配结果供需求者选择

### 认证流程

- 使用 JWT token 进行身份认证
- token 存储在 localStorage
- 前端请求拦截器自动添加 Authorization header
- 后端 authMiddleware 验证 token 并提取 userId

## 环境配置

后端需要 `.env` 文件：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/substitute-matching
JWT_SECRET=your_jwt_secret_key_here
```

## 注意事项

- 前端开发服务器配置了代理，`/api` 请求会转发到 `http://localhost:3000`
- 时间格式统一使用 `HH:mm` 格式字符串
- 所有需要认证的路由都使用 authMiddleware
- 前端路由使用 beforeEach 守卫检查登录状态

## 部署架构

### 生产环境（Render）
- **单服务部署**：后端 Express 服务器同时提供 API 和前端静态文件
- 构建时先构建前端（生成 `frontend/dist`），再安装后端依赖
- 后端服务器使用 `express.static` 提供前端静态文件
- 所有非 API 请求返回 `index.html`，支持 SPA 路由
- API 请求使用相对路径 `/api`，无跨域问题

### 开发环境
- 前端：Vite 开发服务器（端口 5173）
- 后端：Express 服务器（端口 3000）
- 前端通过 Vite 代理将 `/api` 请求转发到后端

详细部署步骤见 `DEPLOYMENT.md`
