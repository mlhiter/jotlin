# 评论@功能说明

## 功能概述

为Jotlin文档编辑器添加了评论中的@功能，支持@用户和@AI助手两种类型的提及。

## 主要功能

### 1. @用户功能

- **自动补全**：在评论输入框中输入`@`时，会显示文档协作者列表
- **用户匹配**：支持按用户名或邮箱前缀匹配
- **通知系统**：被@的用户会收到通知
- **跳转功能**：点击通知可直接跳转到相关文档

### 2. @AI助手功能

- **AI识别**：输入`@AI`或`@ai`来提及AI助手
- **指令解析**：AI能理解不同类型的指令（修改、添加、删除、优化等）
- **自动处理**：AI根据评论内容自动修改文档
- **处理反馈**：提供处理结果的反馈信息

## 技术实现

### 数据库模型

#### Mention模型

```prisma
model Mention {
  id           String   @id @default(uuid())
  type         String   // "user" or "ai"
  targetUserId String?  // 如果是@用户，存储用户ID
  targetEmail  String?  // 如果是@用户，存储用户邮箱
  createdAt    DateTime @default(now())
  commentId    String
  comment      Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
}
```

#### Notification模型

```prisma
model Notification {
  id         String   @id @default(uuid())
  type       String   // "mention", "comment_reply", etc.
  title      String
  content    String   @db.Text
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
  documentId String?
  commentId  String?
  mentionId  String?
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 核心组件

1. **MentionInput** (`components/mention-input.tsx`)
   - 支持@自动补全的输入组件
   - 键盘导航支持
   - 协作者列表显示

2. **NotificationBell** (`components/notification-bell.tsx`)
   - 通知铃铛组件
   - 未读数量显示
   - 通知列表管理

3. **mention-parser** (`libs/mention-parser.ts`)
   - @提及的解析和验证
   - 文本格式化处理

4. **notification-service** (`libs/notification-service.ts`)
   - 通知的创建和管理
   - 已读状态处理

5. **ai-mention-service** (`libs/ai-mention-service.ts`)
   - AI指令解析
   - 文档自动修改

### API端点

- `POST /api/comments` - 创建评论（包含@处理）
- `GET /api/notifications` - 获取通知列表
- `PATCH /api/notifications` - 标记通知已读
- `GET /api/documents/[id]/collaborators` - 获取协作者列表
- `POST /api/ai/process-mention` - AI指令处理

## 使用方法

### 用户@功能

1. 在评论输入框中输入`@`
2. 从弹出的列表中选择要@的用户
3. 被@的用户会收到通知
4. 用户可以点击通知跳转到文档

### AI@功能

1. 在评论中输入`@AI`或`@ai`
2. 在后面描述要AI执行的任务，例如：
   - `@AI 修改这段文字，让它更简洁`
   - `@AI 添加一个关于XXX的段落`
   - `@AI 优化这部分内容的结构`
3. AI会自动处理并修改文档内容

## 样式说明

@提及在显示时会有特殊的样式：

- **@用户**：蓝色背景，圆角边框
- **@AI**：紫色背景，圆角边框
- 支持深色模式

## 扩展性

### 添加新的AI指令类型

在`ai-mention-service.ts`的`parseAIInstruction`函数中添加新的指令识别逻辑。

### 添加新的通知类型

在`notification-service.ts`中扩展通知创建逻辑，并在前端组件中添加相应的显示处理。

### 集成外部AI服务

修改`ai-mention-service.ts`中的`callAIService`函数，集成你的AI服务API。

## 注意事项

1. **权限控制**：只有文档协作者才能被@
2. **AI集成**：目前AI功能使用模拟响应，需要集成真实的AI服务
3. **性能考虑**：通知查询有数量限制，避免一次加载过多数据
4. **错误处理**：@功能的失败不会影响评论的正常创建

## 部署和测试

### 启动agent-server

```bash
cd agent-server/fastapi
source venv/bin/activate
python run.py
```

### 测试AI功能

```bash
cd agent-server
python test_mention.py
```

### 环境变量配置

在`.env`文件中添加：

```
AGENT_SERVER_URL=http://localhost:8000
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选
```

## 故障排除

### 评论列表不刷新

- 检查浏览器控制台是否有JavaScript错误
- 确认`window.refreshComments`函数已正确绑定

### AI不响应

- 检查agent-server是否正常运行（http://localhost:8000/health）
- 确认OpenAI API Key配置正确
- 查看服务器日志中的错误信息

### 通知不显示

- 检查数据库连接是否正常
- 确认用户邮箱在协作者列表中
- 运行测试脚本：`node test-mention-api.js`

### Prisma相关错误

如果遇到 "Cannot read properties of undefined (reading 'create')" 错误：

1. 重新生成Prisma客户端：

   ```bash
   npx prisma generate
   ```

2. 同步数据库：

   ```bash
   npx prisma db push
   ```

3. 检查环境变量配置：
   ```bash
   # 确保.env文件中有正确的DATABASE_URL
   DATABASE_URL="your_database_connection_string"
   ```

### API路由问题

- 确保所有API路由文件都已创建：
  - `/api/notifications/route.ts`
  - `/api/notifications/create/route.ts`
  - `/api/mentions/create/route.ts`
- 检查网络请求是否返回401（正常，需要认证）

## 未来优化

1. **实时通知**：使用WebSocket实现实时通知推送
2. **@群组**：支持@整个协作组
3. **AI上下文增强**：AI处理时考虑更多上下文信息
4. **通知聚合**：相似通知的智能聚合
5. **离线支持**：离线状态下的通知缓存
6. **AI模型切换**：支持多种AI模型选择
7. **批量操作**：支持批量处理多个@AI请求
