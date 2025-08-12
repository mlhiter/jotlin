/**
 * Convert markdown content to BlockNote blocks using BlockNote's built-in parser
 * This should be used in browser environment where BlockNote editor is available
 */
export async function convertMarkdownToBlocks(
  markdown: string,
  editor?: any
): Promise<any[]> {
  try {
    console.log('Converting markdown to blocks, length:', markdown.length)

    if (editor && editor.tryParseMarkdownToBlocks) {
      // Use BlockNote's official markdown parser
      console.log('Using BlockNote official parser')
      const blocks = await editor.tryParseMarkdownToBlocks(markdown)
      console.log('BlockNote parser result:', blocks.length, 'blocks')
      return blocks
    }

    // Fallback: simple markdown to blocks conversion
    console.log('Using fallback parser')
    const blocks = parseMarkdownFallback(markdown)
    console.log('Fallback parser result:', blocks.length, 'blocks')
    return blocks
  } catch (error) {
    console.error('Failed to parse markdown:', error)
    console.log('Markdown content preview:', markdown.substring(0, 200) + '...')

    // Enhanced fallback: split into paragraphs
    const paragraphs = markdown.split('\n\n').filter((p) => p.trim())
    if (paragraphs.length > 1) {
      return paragraphs.map((paragraph) => ({
        id: generateId(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: [{ type: 'text', text: paragraph.trim(), styles: {} }],
        children: [],
      }))
    }

    // Final fallback to simple paragraph
    return [
      {
        id: generateId(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: [{ type: 'text', text: markdown, styles: {} }],
        children: [],
      },
    ]
  }
}

/**
 * Fallback markdown parser for basic formatting with enhanced SRS support
 */
function parseMarkdownFallback(markdown: string): any[] {
  const lines = markdown.split('\n')
  const blocks: any[] = []
  let codeBlockContent = ''
  let inCodeBlock = false
  let codeBlockLanguage = ''
  let inTable = false
  let tableRows: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        // Starting code block
        inCodeBlock = true
        codeBlockLanguage = trimmed.replace('```', '').trim() || 'text'
        codeBlockContent = ''
      } else {
        // Ending code block
        inCodeBlock = false
        blocks.push({
          id: generateId(),
          type: 'codeBlock',
          props: {
            language: codeBlockLanguage,
          },
          content: codeBlockContent,
          children: [],
        })
        codeBlockContent = ''
      }
      continue
    }

    // If inside code block, collect content
    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? '\n' : '') + line
      continue
    }

    // Handle table detection and processing
    if (trimmed.includes('|') && !inCodeBlock) {
      if (!inTable) {
        inTable = true
        tableRows = []
      }
      tableRows.push(line)
      continue
    } else if (inTable) {
      // End of table, process accumulated rows
      processTableRows(tableRows, blocks)
      inTable = false
      tableRows = []
      // Continue processing current line
    }

    // Skip empty lines
    if (!trimmed) {
      // Only add spacing if not in a table
      if (!inTable) {
        blocks.push({
          id: generateId(),
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [{ type: 'text', text: '', styles: {} }],
          children: [],
        })
      }
      continue
    }

    // Headers
    if (trimmed.startsWith('#')) {
      const headerMatch = trimmed.match(/^(#{1,6})\s*(.*)/)
      if (headerMatch) {
        const level = Math.min(headerMatch[1].length, 3) as 1 | 2 | 3
        const text = headerMatch[2] || ''

        blocks.push({
          id: generateId(),
          type: 'heading',
          props: {
            level: level,
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: parseInlineFormatting(text),
          children: [],
        })
        continue
      }
    }

    // Bullet lists
    if (trimmed.match(/^[-*+]\s/)) {
      const text = trimmed.replace(/^[-*+]\s*/, '')
      blocks.push({
        id: generateId(),
        type: 'bulletListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: parseInlineFormatting(text),
        children: [],
      })
      continue
    }

    // Numbered lists (including nested numbering like 1.1, 1.1.1)
    if (trimmed.match(/^(\d+\.)+\s/)) {
      const text = trimmed.replace(/^(\d+\.)+\s*/, '')
      blocks.push({
        id: generateId(),
        type: 'numberedListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: parseInlineFormatting(text),
        children: [],
      })
      continue
    }

    // Simple numbered lists
    if (trimmed.match(/^\d+\.\s/)) {
      const text = trimmed.replace(/^\d+\.\s*/, '')
      blocks.push({
        id: generateId(),
        type: 'numberedListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: parseInlineFormatting(text),
        children: [],
      })
      continue
    }

    // Blockquotes (commonly used in SRS for requirements)
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '')
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'gray',
        },
        content: parseInlineFormatting(text),
        children: [],
      })
      continue
    }

    // Horizontal rules
    if (trimmed.match(/^[-*_]{3,}$/)) {
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
        },
        content: [{ type: 'text', text: '---', styles: {} }],
        children: [],
      })
      continue
    }

    // Regular paragraphs
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
      },
      content: parseInlineFormatting(trimmed),
      children: [],
    })
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockContent) {
    blocks.push({
      id: generateId(),
      type: 'codeBlock',
      props: {
        language: codeBlockLanguage,
      },
      content: codeBlockContent,
      children: [],
    })
  }

  // Handle table at end of file
  if (inTable && tableRows.length > 0) {
    processTableRows(tableRows, blocks)
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          id: generateId(),
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [{ type: 'text', text: '', styles: {} }],
          children: [],
        },
      ]
}

/**
 * Process table rows and convert to BlockNote table structure
 */
function processTableRows(tableRows: string[], blocks: any[]) {
  if (tableRows.length === 0) return

  // Filter out separator rows (e.g., |---|---|)
  const dataRows = tableRows.filter(
    (row) => !row.match(/^\s*\|?[\s\-:]+\|?[\s\-:|]*$/)
  )

  if (dataRows.length === 0) return

  // For now, convert tables to formatted text blocks since BlockNote doesn't have native table support
  // This maintains readability while ensuring the content is preserved

  dataRows.forEach((row, index) => {
    const cells = row
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell !== '')
    const formattedRow = cells.join(' | ')

    blocks.push({
      id: generateId(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: index === 0 ? 'gray' : 'default', // Highlight header row
      },
      content: parseInlineFormatting(formattedRow),
      children: [],
    })
  })

  // Add separator after table
  blocks.push({
    id: generateId(),
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default',
    },
    content: [{ type: 'text', text: '', styles: {} }],
    children: [],
  })
}

/**
 * Parse inline formatting like **bold**, *italic*, `code`
 */
function parseInlineFormatting(text: string): any[] {
  if (!text) {
    return [{ type: 'text', text: '', styles: {} }]
  }

  const content: any[] = []
  let currentText = ''
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const nextChar = text[i + 1]

    // Bold (**text**)
    if (char === '*' && nextChar === '*') {
      if (currentText) {
        content.push({ type: 'text', text: currentText, styles: {} })
        currentText = ''
      }

      i += 2
      let boldText = ''
      let foundEnd = false

      while (i < text.length - 1) {
        if (text[i] === '*' && text[i + 1] === '*') {
          content.push({ type: 'text', text: boldText, styles: { bold: true } })
          i += 2
          foundEnd = true
          break
        }
        boldText += text[i]
        i++
      }

      if (!foundEnd) {
        currentText += '**' + boldText
      }
      continue
    }

    // Italic (*text*)
    if (char === '*' && nextChar !== '*') {
      if (currentText) {
        content.push({ type: 'text', text: currentText, styles: {} })
        currentText = ''
      }

      i++
      let italicText = ''
      let foundEnd = false

      while (i < text.length) {
        if (text[i] === '*') {
          content.push({
            type: 'text',
            text: italicText,
            styles: { italic: true },
          })
          i++
          foundEnd = true
          break
        }
        italicText += text[i]
        i++
      }

      if (!foundEnd) {
        currentText += '*' + italicText
      }
      continue
    }

    // Code (`text`)
    if (char === '`') {
      if (currentText) {
        content.push({ type: 'text', text: currentText, styles: {} })
        currentText = ''
      }

      i++
      let codeText = ''
      let foundEnd = false

      while (i < text.length) {
        if (text[i] === '`') {
          content.push({ type: 'text', text: codeText, styles: { code: true } })
          i++
          foundEnd = true
          break
        }
        codeText += text[i]
        i++
      }

      if (!foundEnd) {
        currentText += '`' + codeText
      }
      continue
    }

    currentText += char
    i++
  }

  if (currentText) {
    content.push({ type: 'text', text: currentText, styles: {} })
  }

  return content.length > 0 ? content : [{ type: 'text', text: '', styles: {} }]
}

/**
 * Generate a random ID for blocks
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
