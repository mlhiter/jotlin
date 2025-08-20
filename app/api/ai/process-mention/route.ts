import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { prompt, document_content, document_title, block_id } =
      await req.json()

    if (!prompt) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // 这里可以集成你现有的AI服务
    // 例如调用你的agent-server或者OpenAI API

    // 调用agent-server处理AI请求
    try {
      const agentServerUrl =
        process.env.AGENT_SERVER_URL || 'http://localhost:8000'
      const aiResponse = await fetch(`${agentServerUrl}/api/process-mention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          document_content: document_content || '',
          document_title: document_title || '',
          block_id: block_id || '',
        }),
      })

      if (aiResponse.ok) {
        const result = await aiResponse.json()
        return NextResponse.json(result)
      } else {
        console.error('Agent server error:', aiResponse.statusText)
        throw new Error(`Agent server responded with ${aiResponse.status}`)
      }
    } catch (error) {
      console.error('Error calling agent-server:', error)

      // 如果agent-server不可用，返回降级响应
      const fallbackResponse = {
        type: 'suggest_edit',
        suggestion: 'AI服务暂时不可用，请稍后再试。你的指令已收到：' + prompt,
        reasoning: 'agent-server连接失败，使用降级响应',
      }

      return NextResponse.json(fallbackResponse)
    }
  } catch (error) {
    console.error('[AI_PROCESS_MENTION]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
