#!/bin/bash

echo "🚀 启动 AI 朋友圈服务..."
echo ""

# 检查并停止已有的服务
echo "📋 检查现有服务..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  端口 3000 已被占用，正在停止..."
    kill -9 $(lsof -ti:3000) 2>/dev/null
    sleep 1
fi

if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  端口 8000 已被占用，正在停止..."
    kill -9 $(lsof -ti:8000) 2>/dev/null
    sleep 1
fi

# 启动后端服务
echo ""
echo "🔧 启动后端服务 (端口 3000)..."
cd backend
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败，请查看 backend.log"
    exit 1
fi

# 启动前端服务
echo ""
echo "🌐 启动前端服务 (端口 8000)..."
python3 -m http.server 8000 > frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# 检查前端是否启动成功
if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ 前端服务启动成功 (PID: $FRONTEND_PID)"
else
    echo "❌ 前端服务启动失败，请查看 frontend.log"
    exit 1
fi

echo ""
echo "🎉 所有服务启动成功！"
echo ""
echo "📝 测试步骤："
echo "   1. 打开浏览器访问:video_player.html"
echo "   2. 点击右下角的 👥 按钮打开 AI 朋友圈"
echo "   3. 点击「发布动态」按钮"
echo "   4. 输入你的观剧感受，例如：「这部剧真好看！」"
echo "   5. 点击发布，等待 10-30 秒"
echo "   6. AI 会自动回复你的动态"
echo ""
echo "🔍 查看日志："
echo "   后端日志: tail -f backend.log"
echo "   前端日志: tail -f frontend.log"
echo ""
echo "🛑 停止服务："
echo "   ./stop-services.sh"
echo ""
