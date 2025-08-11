/**
 * Convert markdown content to BlockNote blocks using BlockNote's built-in parser
 * This should be used in browser environment where BlockNote editor is available
 */
export async function convertMarkdownToBlocks(
  markdown: string,
  editor?: any
): Promise<any[]> {
  try {
    if (editor && editor.tryParseMarkdownToBlocks) {
      // Use BlockNote's official markdown parser
      return await editor.tryParseMarkdownToBlocks(markdown)
    }
    
    // Fallback: simple markdown to blocks conversion
    return parseMarkdownFallback(markdown)
  } catch (error) {
    console.error('Failed to parse markdown:', error)
    // Fallback to simple paragraph
    return [{
      id: generateId(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default'
      },
      content: [{ type: 'text', text: markdown, styles: {} }],
      children: []
    }]
  }
}

/**
 * Fallback markdown parser for basic formatting
 */
function parseMarkdownFallback(markdown: string): any[] {
  const lines = markdown.split('\n')
  const blocks: any[] = []
  let codeBlockContent = ''
  let inCodeBlock = false
  let codeBlockLanguage = ''
  
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
            language: codeBlockLanguage
          },
          content: codeBlockContent,
          children: []
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
    
    // Skip empty lines
    if (!trimmed) {
      // Add empty paragraph for spacing
      blocks.push({
        id: generateId(),
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default'
        },
        content: [{ type: 'text', text: '', styles: {} }],
        children: []
      })
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
            backgroundColor: 'default'
          },
          content: parseInlineFormatting(text),
          children: []
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
          backgroundColor: 'default'
        },
        content: parseInlineFormatting(text),
        children: []
      })
      continue
    }
    
    // Numbered lists
    if (trimmed.match(/^\d+\.\s/)) {
      const text = trimmed.replace(/^\d+\.\s*/, '')
      blocks.push({
        id: generateId(),
        type: 'numberedListItem',
        props: {
          textColor: 'default',
          backgroundColor: 'default'
        },
        content: parseInlineFormatting(text),
        children: []
      })
      continue
    }
    
    // Regular paragraphs
    blocks.push({
      id: generateId(),
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default'
      },
      content: parseInlineFormatting(trimmed),
      children: []
    })
  }
  
  // Handle unclosed code block
  if (inCodeBlock && codeBlockContent) {
    blocks.push({
      id: generateId(),
      type: 'codeBlock',
      props: {
        language: codeBlockLanguage
      },
      content: codeBlockContent,
      children: []
    })
  }
  
  return blocks.length > 0 ? blocks : [{
    id: generateId(),
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default'
    },
    content: [{ type: 'text', text: '', styles: {} }],
    children: []
  }]
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
          content.push({ type: 'text', text: italicText, styles: { italic: true } })
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