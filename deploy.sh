#!/bin/bash

# 快速提交和推送脚本

echo "准备提交代码..."
echo ""

# 显示当前状态
echo "当前修改的文件："
git status --short
echo ""

# 添加所有修改
echo "添加所有修改到暂存区..."
git add .
echo ""

# 提交
echo "提交代码..."
git commit -m "修复部署问题：
- 修正前端 API baseURL，添加 /api 前缀
- 添加 CORS OPTIONS 方法支持
- 创建 _redirects 文件支持 Vue Router History 模式
- 添加部署文档和测试脚本
- 更新 README 和配置文件"
echo ""

# 推送
echo "推送到 GitHub..."
git push origin main
echo ""

echo "完成！代码已推送到 GitHub。"
echo "现在请到 Render 控制台手动触发部署："
echo "1. 后端：https://dashboard.render.com -> daike-backend -> Manual Deploy"
echo "2. 前端：https://dashboard.render.com -> daike-frontend -> Manual Deploy"
