#!/bin/bash

# 本地测试脚本 - 模拟生产环境部署

echo "=== 开始构建前端 ==="
cd frontend
npm install
npm run build

echo ""
echo "=== 前端构建完成 ==="
echo "检查 dist 目录..."
ls -la dist/

echo ""
echo "=== 安装后端依赖 ==="
cd ../backend
npm install

echo ""
echo "=== 准备启动服务器 ==="
echo "请确保已设置环境变量："
echo "  - MONGODB_URI"
echo "  - JWT_SECRET"
echo ""
echo "启动命令: npm start"
echo "访问地址: http://localhost:3000"
