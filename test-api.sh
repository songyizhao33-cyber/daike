#!/bin/bash

# 测试后端 API 是否正常工作

echo "测试后端 API..."
echo ""

# 测试根路径
echo "1. 测试根路径 (/):"
curl -s https://daike.onrender.com/ | jq '.' || echo "请求失败"
echo ""

# 测试 API 根路径
echo "2. 测试 API 根路径 (/api):"
curl -s https://daike.onrender.com/api || echo "请求失败"
echo ""

# 测试注册接口（应该返回错误，因为没有提供数据）
echo "3. 测试注册接口 (/api/auth/register):"
curl -s -X POST https://daike.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "请求失败"
echo ""

# 测试登录接口（应该返回错误，因为没有提供数据）
echo "4. 测试登录接口 (/api/auth/login):"
curl -s -X POST https://daike.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "请求失败"
echo ""

echo "测试完成！"
echo ""
echo "如果看到 JSON 响应，说明后端 API 正常工作。"
echo "如果看到 HTML 或 404 错误，说明路由配置有问题。"
