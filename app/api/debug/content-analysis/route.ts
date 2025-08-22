import { NextRequest, NextResponse } from 'next/server'

import { analyzeContent } from '@/libs/content-detector'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json()

    if (!content) {
      return new NextResponse('Content is required', { status: 400 })
    }

    const analysis = analyzeContent(content)

    return NextResponse.json({
      analysis,
      contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      contentLength: content.length,
    })
  } catch (error) {
    console.error('[CONTENT_ANALYSIS_DEBUG]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
