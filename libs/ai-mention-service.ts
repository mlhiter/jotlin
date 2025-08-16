import { prisma } from '@/libs/prisma'

export interface AIMentionContext {
  commentContent: string
  documentId: string
  blockId: string
  documentContent?: string
  documentTitle?: string
  replyToCommentId?: string // 如果是回复，包含被回复评论的ID
  commentChain?: Array<{
    content: string
    isAI: boolean
    createdAt: string
  }> // 评论链历史
}

export interface AIAction {
  type:
    | 'modify_content'
    | 'add_content'
    | 'suggest_edit'
    | 'delete_content'
    | 'no_action'
  content?: string | Array<any> | object
  blockId?: string
  suggestion?: string
  reasoning?: string
}

/**
 * 解析AI提及的指令类型
 */
export function parseAIInstruction(commentContent: string): {
  action: string
  instruction: string
} {
  const content = commentContent.toLowerCase()

  // 移除@ai部分，提取指令
  const cleanContent = commentContent.replace(/@ai\s*/gi, '').trim()

  // 识别不同类型的指令
  if (
    content.includes('修改') ||
    content.includes('更改') ||
    content.includes('替换')
  ) {
    return { action: 'modify', instruction: cleanContent }
  } else if (
    content.includes('添加') ||
    content.includes('增加') ||
    content.includes('插入')
  ) {
    return { action: 'add', instruction: cleanContent }
  } else if (content.includes('删除') || content.includes('移除')) {
    return { action: 'delete', instruction: cleanContent }
  } else if (
    content.includes('优化') ||
    content.includes('改进') ||
    content.includes('完善')
  ) {
    return { action: 'optimize', instruction: cleanContent }
  } else if (content.includes('翻译') || content.includes('转换')) {
    return { action: 'translate', instruction: cleanContent }
  } else {
    return { action: 'general', instruction: cleanContent }
  }
}

/**
 * 直接处理AI提及，避免API循环调用
 */
export async function processAIMentionDirect(
  context: AIMentionContext
): Promise<AIAction> {
  try {
    // 获取文档内容（在服务器端，我们已经有了文档内容）
    const { action, instruction } = parseAIInstruction(context.commentContent)

    // 直接调用agent-server处理
    const agentServerUrl =
      process.env.AGENT_SERVER_URL || 'http://localhost:8000'

    try {
      const aiResponse = await fetch(`${agentServerUrl}/api/process-mention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: context.commentContent,
          document_content: context.documentContent || '',
          document_title: context.documentTitle || '',
          block_id: context.blockId || '',
        }),
      })

      if (aiResponse.ok) {
        const result = await aiResponse.json()
        return result
      } else {
        console.error('Agent server error:', aiResponse.statusText)
        throw new Error(`Agent server responded with ${aiResponse.status}`)
      }
    } catch (error) {
      console.error('Error calling agent-server:', error)

      // 如果agent-server不可用，返回降级响应
      return {
        type: 'suggest_edit',
        suggestion:
          'AI服务暂时不可用，请稍后再试。你的指令已收到：' +
          context.commentContent,
        reasoning: 'agent-server连接失败，使用降级响应',
      }
    }
  } catch (error) {
    console.error('Error processing AI mention:', error)
    return {
      type: 'no_action',
      reasoning: `处理AI指令时出错: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 处理AI提及，调用AI服务修改文档（保留原函数用于客户端调用）
 */
export async function processAIMention(
  context: AIMentionContext
): Promise<AIAction> {
  try {
    // 获取文档内容
    const document = await prisma.document.findUnique({
      where: { id: context.documentId },
      select: { content: true, title: true },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const { action, instruction } = parseAIInstruction(context.commentContent)

    // 构造AI请求
    const aiPrompt = buildAIPrompt({
      action,
      instruction,
      documentContent: document.content || '',
      documentTitle: document.title,
      blockId: context.blockId,
      commentChain: context.commentChain,
      isReplyToAI: !!context.replyToCommentId,
    })

    // 调用AI服务
    const aiResponse = await callAIService(aiPrompt, {
      document_content: document.content || '',
      document_title: document.title,
      block_id: context.blockId,
    })

    return aiResponse
  } catch (error) {
    console.error('Error processing AI mention:', error)
    return {
      type: 'no_action',
      reasoning: `处理AI指令时出错: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
}

/**
 * 构造AI提示词
 */
function buildAIPrompt(params: {
  action: string
  instruction: string
  documentContent: string
  documentTitle: string
  blockId: string
  commentChain?: Array<{
    content: string
    isAI: boolean
    createdAt: string
  }>
  isReplyToAI?: boolean
}): string {
  const {
    action,
    instruction,
    documentContent,
    documentTitle,
    blockId,
    commentChain,
    isReplyToAI,
  } = params

  let contextSection = ''
  if (commentChain && commentChain.length > 0) {
    contextSection = `

评论对话历史：
${commentChain.map((c, i) => `${i + 1}. ${c.isAI ? '[AI回复]' : '[用户评论]'}: ${c.content}`).join('\n')}
`
  }

  let roleContext = ''
  if (isReplyToAI) {
    roleContext = `
特别说明：用户正在回复你之前的AI回复，可能是：
- 对你之前回复的反馈或建议
- 要求进一步修改或澄清
- 表达不同意见并希望你重新考虑
请仔细考虑用户的反馈，并根据需要调整你的回应或操作。
`
  }

  return `
你是一个文档编辑助手。用户在文档《${documentTitle}》的评论中@了你，需要你根据指令来修改文档内容。

当前文档内容：
\`\`\`
${documentContent}
\`\`\`
${contextSection}${roleContext}
用户指令类型：${action}
用户具体指令：${instruction}
评论所在的块ID：${blockId}

请根据用户的指令，返回以下格式的JSON响应：

\`\`\`json
{
  "type": "modify_content" | "add_content" | "suggest_edit" | "delete_content" | "no_action",
  "content": "要添加或修改的内容（如果适用）",
  "blockId": "要修改或删除的块ID（如果适用）",
  "suggestion": "修改建议（如果type是suggest_edit）",
  "reasoning": "执行此操作的原因说明"
}
\`\`\`

操作类型说明：
- **add_content**: 在文档末尾或指定位置添加新内容
- **modify_content**: 修改现有内容（如果提供blockId则修改指定块，否则修改整个文档）
- **delete_content**: 删除指定的块（需要提供blockId）
- **suggest_edit**: 提供修改建议而不直接操作
- **no_action**: 无法执行操作

注意事项：
1. 如果用户指令不够明确，返回type为"suggest_edit"并提供建议
2. 如果指令无法执行，返回type为"no_action"并说明原因
3. 优先使用"add_content"在文档末尾添加新内容，避免破坏现有结构
4. 使用"modify_content"时，如果要修改特定段落，请提供对应的blockId
5. 使用"delete_content"时，必须提供要删除的blockId
6. 确保修改符合用户的意图和上下文
7. 生成的内容应该简洁明了，直接回答用户的问题或执行用户的指令
8. 如果是对AI回复的反馈，要虚心接受建议并进行相应调整
`
}

/**
 * 调用AI服务
 */
async function callAIService(
  prompt: string,
  context?: {
    document_content: string
    document_title: string
    block_id: string
  }
): Promise<AIAction> {
  try {
    const baseUrl = process.env.HOST
    const response = await fetch(`${baseUrl}/api/ai/process-mention`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        ...context,
      }),
    })

    if (!response.ok) {
      throw new Error('AI service request failed')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error calling AI service:', error)
    return {
      type: 'no_action',
      reasoning: 'AI服务暂时不可用，请稍后再试',
    }
  }
}

/**
 * 应用AI的修改建议到文档
 */
export async function applyAIModification(
  documentId: string,
  modification: AIAction,
  commentBlockId?: string
): Promise<{
  success: boolean
  message: string
  newContent?: string
  insertInstruction?: {
    type: 'add_block' | 'modify_block' | 'delete_block'
    content?: string
    afterBlockId?: string
    targetBlockId?: string
    insertAtEnd?: boolean
  }
}> {
  try {
    if (modification.type === 'no_action') {
      return {
        success: false,
        message: modification.reasoning || 'AI无法处理此请求',
      }
    }

    if (modification.type === 'suggest_edit') {
      return {
        success: true,
        message: `AI建议：${modification.suggestion}`,
      }
    }

    if (
      modification.type === 'add_content' &&
      modification.content &&
      commentBlockId
    ) {
      // 不在这里直接修改文档，而是返回插入指令让前端处理
      return {
        success: true,
        message: `AI回复：${modification.reasoning}`,
        insertInstruction: {
          type: 'add_block',
          content:
            typeof modification.content === 'string'
              ? modification.content
              : JSON.stringify(modification.content),
          afterBlockId: commentBlockId,
          insertAtEnd: true, // 建议插入到文档末尾
        },
      }
    }

    if (modification.type === 'modify_content' && modification.content) {
      // 检查是否有指定的blockId进行局部修改
      if (modification.blockId && commentBlockId) {
        return {
          success: true,
          message: `AI回复：${modification.reasoning}`,
          insertInstruction: {
            type: 'modify_block',
            content:
              typeof modification.content === 'string'
                ? modification.content
                : JSON.stringify(modification.content),
            targetBlockId: modification.blockId,
          },
        }
      } else {
        // 全文档修改
        let contentToSave: string

        if (typeof modification.content === 'string') {
          contentToSave = modification.content
        } else if (
          Array.isArray(modification.content) ||
          typeof modification.content === 'object'
        ) {
          // 如果是数组或对象，转换为JSON字符串
          contentToSave = JSON.stringify(modification.content)
        } else {
          contentToSave = String(modification.content)
        }

        // 更新文档内容
        await prisma.document.update({
          where: { id: documentId },
          data: { content: contentToSave },
        })

        return {
          success: true,
          message: `AI已根据指令修改了文档内容。修改原因：${modification.reasoning}`,
          newContent: contentToSave,
        }
      }
    }

    // 支持删除操作
    if (modification.type === 'delete_content' && modification.blockId) {
      return {
        success: true,
        message: `AI回复：${modification.reasoning}`,
        insertInstruction: {
          type: 'delete_block',
          targetBlockId: modification.blockId,
        },
      }
    }

    return {
      success: false,
      message: 'AI响应格式不正确',
    }
  } catch (error) {
    console.error('Error applying AI modification:', error)
    return {
      success: false,
      message: '应用AI修改时出错',
    }
  }
}
