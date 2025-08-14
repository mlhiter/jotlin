import { prisma } from '@/libs/prisma'

export interface AIMentionContext {
  commentContent: string
  documentId: string
  blockId: string
  documentContent?: string
  documentTitle?: string
}

export interface AIAction {
  type: 'modify_content' | 'add_content' | 'suggest_edit' | 'no_action'
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
}): string {
  const { action, instruction, documentContent, documentTitle, blockId } =
    params

  return `
你是一个文档编辑助手。用户在文档《${documentTitle}》的评论中@了你，需要你根据指令来修改文档内容。

当前文档内容：
\`\`\`
${documentContent}
\`\`\`

用户指令类型：${action}
用户具体指令：${instruction}
评论所在的块ID：${blockId}

请根据用户的指令，返回以下格式的JSON响应：

\`\`\`json
{
  "type": "modify_content" | "add_content" | "suggest_edit" | "no_action",
  "content": "修改后的内容（如果适用）",
  "blockId": "要修改的块ID（如果适用）",
  "suggestion": "修改建议（如果type是suggest_edit）",
  "reasoning": "执行此操作的原因说明"
}
\`\`\`

注意事项：
1. 如果用户指令不够明确，返回type为"suggest_edit"并提供建议
2. 如果指令无法执行，返回type为"no_action"并说明原因
3. 修改内容时保持文档的原有格式和结构
4. 确保修改符合用户的意图和上下文
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
  modification: AIAction
): Promise<{ success: boolean; message: string }> {
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

    if (modification.type === 'modify_content' && modification.content) {
      // 处理不同类型的content数据
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

      // 通知前端重新加载文档
      if (typeof window !== 'undefined' && (window as any).reloadDocument) {
        setTimeout(() => {
          ;(window as any).reloadDocument()
        }, 500)
      }

      return {
        success: true,
        message: `AI已根据指令修改了文档内容。修改原因：${modification.reasoning}`,
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
