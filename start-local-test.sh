#!/bin/bash

# 本地测试启动脚本
# 使用方法：在 Git Bash 中运行 ./start-local-test.sh

echo "================================"
echo "代课匹配系统 - 本地测试启动"
echo "================================"
echo ""

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo "📦 检查依赖..."

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
    echo "安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "安装前端依赖..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ 依赖检查完成"
echo ""
echo "🚀 启动服务..."
echo ""
echo "后端服务将在 http://localhost:3000 启动"
echo "前端服务将在 http://localhost:5173 启动"
echo ""
echo "⚠️  注意：需要打开两个终端窗口"
echo ""
echo "终端1 - 启动后端："
echo "  cd backend && npm run dev"
echo ""
echo "终端2 - 启动前端："
echo "  cd frontend && npm run dev"
echo ""
echo "================================"
echo "测试完成后，按 Ctrl+C 停止服务"
echo "================================"
