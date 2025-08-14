# 快速测试@功能修复

## 已修复的问题

1. **Prisma相关错误**: 将所有数据库操作移到了API route handlers中
2. **URL错误**: 修复了AI服务调用中的无效URL问题
3. **API架构**: 重构为标准的Next.js API route模式

## 测试步骤

### 1. 启动应用

```bash
npm run dev
```

### 2. 测试@用户功能

1. 在文档中选择文本并添加评论
2. 输入 `@用户邮箱` 来@用户
3. 检查是否创建了评论
4. 检查通知铃铛是否显示未读数量

### 3. 测试@AI功能

1. 在评论中输入 `@AI 修改这段内容，让它更简洁`
2. 检查是否收到AI处理结果的反馈
3. 如果agent-server运行，检查文档是否被修改

### 4. 启动agent-server（可选）

```bash
cd agent-server/fastapi
source venv/bin/activate
python run.py
```

## 新的API端点

- `POST /api/notifications/create` - 创建通知
- `POST /api/mentions/create` - 处理@提及
- `GET /api/notifications?countOnly=true` - 获取未读数量
- `PATCH /api/notifications?markAllAsRead=true` - 标记全部已读

## 预期行为

✅ 评论创建后列表自动刷新
✅ @用户会发送通知
✅ @AI会显示处理结果反馈
✅ 不再出现Prisma错误
✅ 不再出现URL解析错误

## 如果还有问题

检查浏览器控制台和服务器日志，错误信息会更清晰地指出问题所在。
