import { NextResponse } from 'next/server'

import { auth } from '@/libs/auth'
import { prisma } from '@/libs/prisma'
import { convertMarkdownToBlocks } from '@/libs/markdown-to-blocknote'

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { title, markdownContent, parentDocument, chatId } = await req.json()

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
          userId: session.user.id,
        },
      })

      if (!chat) {
        return new NextResponse('Chat not found or access denied', {
          status: 404,
        })
      }
    }

    try {
      // Log the markdown content for debugging
      console.log('Processing document:', title)
      console.log('Markdown length:', markdownContent.length)
      console.log(
        'Markdown preview:',
        markdownContent.substring(0, 500) + '...'
      )

      // Check if the "markdown" content is actually already BlockNote JSON
      let content: string
      try {
        const possibleBlocks = JSON.parse(markdownContent)
        if (
          Array.isArray(possibleBlocks) &&
          possibleBlocks.length > 0 &&
          possibleBlocks[0]?.type
        ) {
          console.log('Input is already BlockNote JSON format, using directly')
          content = markdownContent
        } else {
          throw new Error('Not BlockNote format')
        }
      } catch {
        // Input is actual markdown, convert it
        console.log('Input is markdown, converting to BlockNote blocks')
        const blocks = await convertMarkdownToBlocks(markdownContent, null)
        content = JSON.stringify(blocks)
        console.log('Successfully converted to', blocks.length, 'blocks')
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

      return NextResponse.json({
        id: document.id,
        title: document.title,
        markdownContent,
        warning:
          'Document created with fallback parsing due to markdown format issues',
      })
    }
  } catch (error) {
    console.error('[DOCUMENTS_CREATE_FROM_MARKDOWN]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
