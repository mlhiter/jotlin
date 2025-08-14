#!/bin/bash

echo "🔍 验证@功能设置..."
echo "=========================="

# 检查必要的文件是否存在
echo "📁 检查API路由文件:"

FILES=(
    "app/api/notifications/route.ts"
    "app/api/notifications/create/route.ts"
    "app/api/mentions/create/route.ts"
    "app/api/comments/route.ts"
    "libs/notification-service.ts"
    "libs/mention-parser.ts"
    "libs/ai-mention-service.ts"
    "components/mention-input.tsx"
    "components/notification-bell.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (缺失)"
    fi
done

echo ""
echo "🗄️  检查数据库模型:"
if grep -q "model Notification" prisma/schema.prisma; then
    echo "  ✅ Notification模型存在"
else
    echo "  ❌ Notification模型缺失"
fi

if grep -q "model Mention" prisma/schema.prisma; then
    echo "  ✅ Mention模型存在"
else
    echo "  ❌ Mention模型缺失"
fi

echo ""
echo "🔧 检查Prisma客户端:"
if [ -d "node_modules/@prisma/client" ]; then
    echo "  ✅ Prisma客户端已生成"
else
    echo "  ❌ Prisma客户端未生成，请运行: npx prisma generate"
fi

echo ""
echo "📋 验证完成!"
echo ""
echo "🚀 如果所有检查都通过，你可以："
echo "  1. 启动开发服务器: npm run dev"
echo "  2. 测试@功能: 在评论中输入 @AI 或 @用户邮箱"
echo "  3. 查看通知: 点击导航栏中的通知铃铛"