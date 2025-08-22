import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { convertMarkdownToBlocks } from '@/libs/markdown-to-blocknote'
import { prisma } from '@/libs/prisma'

// 告诉 Next.js 这个路由是动态的
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, markdownContent, parentDocument, chatId } = await req.json()
    
    console.log('[CREATE_FROM_MARKDOWN] Request received:', {
      title,
      contentLength: markdownContent?.length || 0,
      parentDocument,
      chatId,
      userId: session.user.id,
      userEmail: session.user.email
    })

    // Validate required fields
    if (!title || !markdownContent) {
      return new NextResponse('Title and markdown content are required', {
        status: 400,
      })
    }

    // If parentDocument is provided, verify it exists
    if (parentDocument) {
      const parent = await prisma.document.findUnique({
        where: { id: parentDocument },
      })

      if (!parent) {
        return new NextResponse('Parent document not found', { status: 404 })
      }
    }

    // If chatId is provided, verify it exists and user has access
    if (chatId) {
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { userId: session.user.id }, // User is owner
            { 
              collaborators: {
                some: {
                  userEmail: session.user.email // User is collaborator
                }
              }
            }
          ]
        },
        include: {
          collaborators: true
        }
      })

      if (!chat) {
        return new NextResponse('Chat not found or access denied', {
          status: 404,
        })
      }
    }

    try {
      // Check if the "markdown" content is actually already BlockNote JSON
      let content: string
      try {
        const possibleBlocks = JSON.parse(markdownContent)
        if (Array.isArray(possibleBlocks) && possibleBlocks.length > 0 && possibleBlocks[0]?.type) {
          content = markdownContent
        } else {
          throw new Error('Not BlockNote format')
        }
      } catch {
        // Input is actual markdown, convert it
        const blocks = await convertMarkdownToBlocks(markdownContent, null)
        content = JSON.stringify(blocks)
      }

      // Create the document
      const document = await prisma.document.create({
        data: {
          title,
          content,
          parentId: parentDocument,
          chatId: chatId,
          userId: session.user.id,
          collaborators: {
            create: {
              userEmail: session.user.email,
            },
          },
        },
      })

      console.log('[CREATE_FROM_MARKDOWN] Document created successfully:', {
        documentId: document.id,
        title: document.title
      })

      return NextResponse.json({
        id: document.id,
        title: document.title,
        markdownContent,
      })
    } catch (parseError) {
      console.error('Markdown parsing error:', parseError)

      // Fallback: create document with raw markdown as paragraph
      const fallbackBlocks = [
        {
          id: Math.random().toString(36).substring(2, 11),
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [{ type: 'text', text: markdownContent, styles: {} }],
          children: [],
        },
      ]

      const document = await prisma.document.create({
        data: {
          title,
          content: JSON.stringify(fallbackBlocks),
          parentId: parentDocument,
          chatId: chatId,
          userId: session.user.id,
          collaborators: {
            create: {
              userEmail: session.user.email,
            },
          },
        },
      })

      console.log('[CREATE_FROM_MARKDOWN] Document created with fallback:', {
        documentId: document.id,
        title: document.title,
        warning: 'Used fallback parsing'
      })

      return NextResponse.json({
        id: document.id,
        title: document.title,
        markdownContent,
        warning: 'Document created with fallback parsing due to markdown format issues',
      })
    }
  } catch (error) {
    console.error('[DOCUMENTS_CREATE_FROM_MARKDOWN]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
