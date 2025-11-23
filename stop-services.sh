#!/bin/bash

echo "🛑 停止 AI 朋友圈服务..."
echo ""

# 停止后端服务
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "🔧 停止后端服务 (端口 3000)..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    echo "✅ 后端服务已停止"
else
    echo "ℹ️  后端服务未运行"
fi

# 停止前端服务
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "🌐 停止前端服务 (端口 8000)..."
    kill -9 $(lsof -ti:8000) 2>/dev/null
    echo "✅ 前端服务已停止"
else
    echo "ℹ️  前端服务未运行"
fi

echo ""
echo "✅ 所有服务已停止"
