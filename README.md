# 代课匹配系统

一个基于 Vue 3 + Node.js 的代课匹配平台，帮助代课者和需求者高效匹配。

## 功能特性

- 用户注册和登录
- 代课者可以标记空闲时间（支持单次和长期重复）
- 需求者可以发布代课需求并自动匹配可用的代课者
- 支持按性别、专业、年级等条件筛选代课者
- 查看匹配历史和管理代课请求

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT 身份认证
- bcryptjs 密码加密

### 前端
- Vue 3 + Vite
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Axios HTTP 客户端

## 快速开始

### 前置要求

- Node.js 16+
- MongoDB 4.4+

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/substitute-matching
JWT_SECRET=your_jwt_secret_key_here
```

### 启动项目

```bash
# 启动后端服务（在 backend 目录）
npm run dev

# 启动前端服务（在 frontend 目录）
npm run dev
```

前端访问地址：http://localhost:5173
后端 API 地址：http://localhost:3000

## 项目结构

```
代课匹配/
├── backend/                 # 后端代码
│   ├── models/             # 数据模型
│   │   ├── User.js         # 用户模型
│   │   ├── Availability.js # 空闲时间模型
│   │   └── MatchRequest.js # 匹配请求模型
│   ├── routes/             # API 路由
│   │   ├── auth.js         # 认证路由
│   │   ├── availability.js # 空闲时间路由
│   │   └── match.js        # 匹配路由
│   ├── middleware/         # 中间件
│   │   └── auth.js         # 认证中间件
│   └── server.js           # 服务器入口
└── frontend/               # 前端代码
    ├── src/
    │   ├── views/          # 页面组件
    │   ├── stores/         # Pinia 状态管理
    │   ├── router/         # 路由配置
    │   ├── utils/          # 工具函数
    │   ├── App.vue         # 根组件
    │   └── main.js         # 入口文件
    └── index.html          # HTML 模板
```

## API 接口

### 认证
- POST `/api/auth/register` - 用户注册
- POST `/api/auth/login` - 用户登录

### 空闲时间管理
- POST `/api/availability` - 添加空闲时间
- GET `/api/availability/my` - 获取我的空闲时间
- DELETE `/api/availability/:id` - 删除空闲时间

### 匹配
- POST `/api/match` - 创建匹配请求
- GET `/api/match/my-requests` - 获取我的匹配请求
- PUT `/api/match/:id/select` - 选择代课者

## 开发说明

- 后端使用 nodemon 实现热重载
- 前端使用 Vite 开发服务器，支持热模块替换
- 所有 API 请求需要在 Header 中携带 JWT token（除了注册和登录）
