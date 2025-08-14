/**
 * 评论中@功能的解析工具
 */

export interface MentionMatch {
  type: 'user' | 'ai'
  match: string // 完整匹配的字符串，如 "@username" 或 "@AI"
  identifier: string // 用户标识符或AI标识符
  startIndex: number // 在文本中的开始位置
  endIndex: number // 在文本中的结束位置
}

export interface ParsedMention {
  type: 'user' | 'ai'
  targetUserId?: string
  targetEmail?: string
  originalText: string
}

/**
 * 解析评论内容中的@提及
 * @param content 评论内容
 * @returns 解析出的@提及数组
 */
export function parseMentions(content: string): MentionMatch[] {
  const mentions: MentionMatch[] = []

  // 正则表达式匹配 @username 或 @AI
  // 支持中文、英文、数字、下划线、连字符
  const mentionRegex = /@(AI|ai|[\w\u4e00-\u9fa5]+)/g

  let match
  while ((match = mentionRegex.exec(content)) !== null) {
    const fullMatch = match[0]
    const identifier = match[1]

    // 判断是AI还是用户
    const isAI = identifier.toLowerCase() === 'ai'

    mentions.push({
      type: isAI ? 'ai' : 'user',
      match: fullMatch,
      identifier: identifier,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
    })
  }

  return mentions
}

/**
 * 将文本中的@提及转换为可点击的链接格式
 * @param content 原始内容
 * @param mentions 解析出的提及
 * @returns 格式化后的内容
 */
export function formatMentionsInText(
  content: string,
  mentions: MentionMatch[]
): string {
  if (mentions.length === 0) return content

  // 从后往前替换，避免索引变化
  const sortedMentions = mentions.sort((a, b) => b.startIndex - a.startIndex)

  let formattedContent = content

  for (const mention of sortedMentions) {
    const before = formattedContent.substring(0, mention.startIndex)
    const after = formattedContent.substring(mention.endIndex)

    let replacement
    if (mention.type === 'ai') {
      replacement = `<span class="mention mention-ai" data-type="ai" data-identifier="${mention.identifier}">@AI助手</span>`
    } else {
      replacement = `<span class="mention mention-user" data-type="user" data-identifier="${mention.identifier}">@${mention.identifier}</span>`
    }

    formattedContent = before + replacement + after
  }

  return formattedContent
}

/**
 * 根据用户名或邮箱查找用户信息
 * @param identifier 用户标识符（用户名或邮箱）
 * @param collaborators 文档协作者列表
 * @returns 匹配的用户信息
 */
export function findUserByIdentifier(
  identifier: string,
  collaborators: Array<{ userEmail: string }>
): { email: string } | null {
  // 先尝试直接匹配邮箱
  const emailMatch = collaborators.find((c) => c.userEmail === identifier)
  if (emailMatch) {
    return { email: emailMatch.userEmail }
  }

  // 尝试匹配邮箱的用户名部分
  const usernameMatch = collaborators.find((c) => {
    const emailUsername = c.userEmail.split('@')[0]
    return emailUsername === identifier
  })

  if (usernameMatch) {
    return { email: usernameMatch.userEmail }
  }

  return null
}

/**
 * 验证@提及的有效性
 * @param mentions 解析出的提及
 * @param collaborators 文档协作者列表
 * @returns 有效的提及列表
 */
export function validateMentions(
  mentions: MentionMatch[],
  collaborators: Array<{ userEmail: string }>
): ParsedMention[] {
  const validMentions: ParsedMention[] = []

  for (const mention of mentions) {
    if (mention.type === 'ai') {
      validMentions.push({
        type: 'ai',
        originalText: mention.match,
      })
    } else {
      const user = findUserByIdentifier(mention.identifier, collaborators)
      if (user) {
        validMentions.push({
          type: 'user',
          targetEmail: user.email,
          originalText: mention.match,
        })
      }
    }
  }

  return validMentions
}
