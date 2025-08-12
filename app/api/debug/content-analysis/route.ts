import { NextResponse } from 'next/server'
import { analyzeContent } from '@/libs/content-detector'

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    const analysis = analyzeContent(content)

    return NextResponse.json({
      analysis,
      contentPreview:
        content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      contentLength: content.length,
    })
  } catch (error) {
    console.error('[CONTENT_ANALYSIS_DEBUG]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
