import { NextResponse } from 'next/server'
import { auth } from '@/libs/auth'
import { processMentions } from '@/libs/mention-service'
import { ParsedMention } from '@/libs/mention-parser'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const {
      mentions,
      commentId,
      documentId,
      mentionerName,
      documentTitle,
    }: {
      mentions: ParsedMention[]
      commentId: string
      documentId: string
      mentionerName: string
      documentTitle: string
    } = await req.json()

    console.log(
      '📧 Processing mentions:',
      mentions.map((m) => `${m.type}:${m.targetEmail || 'AI'}`).join(', ')
    )

    if (
      !mentions ||
      !commentId ||
      !documentId ||
      !mentionerName ||
      !documentTitle
    ) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 使用统一的mention处理服务
    const result = await processMentions({
      mentions,
      commentId,
      documentId,
      mentionerName,
      documentTitle,
    })

    if (result.success) {
      return NextResponse.json(result.notifications)
    } else {
      return new NextResponse(result.error || 'Internal Error', { status: 500 })
    }
  } catch (error) {
    console.error('[MENTIONS_CREATE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
