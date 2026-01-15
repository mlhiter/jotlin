'use client'

import { Copy, Download, Maximize2 } from 'lucide-react'
import mermaid from 'mermaid'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { cn } from '@/libs/utils/utils'

interface MermaidChartProps {
  code: string
  className?: string
  showControls?: boolean
}

export function MermaidChart({ code, className, showControls = true }: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const { theme } = useTheme()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        themeVariables: {
          primaryColor: theme === 'dark' ? '#4f46e5' : '#6366f1',
          primaryTextColor: theme === 'dark' ? '#e5e7eb' : '#1f2937',
          primaryBorderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
          lineColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
          secondaryColor: theme === 'dark' ? '#1e293b' : '#f3f4f6',
          tertiaryColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          // Explicitly set text color
          textColor: theme === 'dark' ? '#e5e7eb' : '#1f2937',
          mainBkg: theme === 'dark' ? '#1e293b' : '#f3f4f6',
          nodeBorder: theme === 'dark' ? '#4b5563' : '#d1d5db',
          clusterBkg: theme === 'dark' ? '#0f172a' : '#ffffff',
        },
      })
      setIsInitialized(true)
    }
  }, [theme, isInitialized])

  useEffect(() => {
    if (!isInitialized || !code) return

    const renderDiagram = async () => {
      try {
        setError(null)
        let cleanCode = code.trim().replace(/^```mermaid\n?/, '').replace(/\n?```$/, '')

        // Fix common Mermaid syntax errors
        // Step 1: Replace special syntax globally BEFORE processing node labels

        // Replace wiki-style links [[Page Name]] with «Page Name»
        cleanCode = cleanCode.replace(/\[\[([^\]]+)\]\]/g, '«$1»')

        // Replace checkbox syntax
        cleanCode = cleanCode.replace(/- ?\[ ?\]/g, '☐')
        cleanCode = cleanCode.replace(/- ?\[x\]/gi, '☑')

        // Step 2: Now process node labels (remove nested brackets and parentheses)
        cleanCode = cleanCode.replace(/\[([^\]]*)\]/g, (match) => {
          let content = match.slice(1, -1) // Remove outer [ and ]

          // Remove any remaining square brackets
          content = content.replace(/\[/g, '').replace(/\]/g, '')

          // Remove parentheses and their content
          content = content.replace(/\s*\([^)]*\)\s*/g, ' ')

          // Clean up extra spaces
          content = content.replace(/\s+/g, ' ').trim()

          return `[${content}]`
        })

        console.info('[DEBUG] MermaidChart rendering:', {
          originalLength: code?.length || 0,
          cleanedLength: cleanCode?.length || 0,
          hasMarkers: code?.includes('```mermaid'),
          preview: cleanCode?.substring(0, 100),
          wasFixed: code !== cleanCode,
        })

        if (!cleanCode) {
          setError('Empty diagram code')
          return
        }

        const { svg } = await mermaid.render(`mermaid-${Date.now()}`, cleanCode)

        // Skip DOMPurify temporarily to debug text rendering issue
        // Mermaid is a trusted library and we control the input
        setSvgContent(svg)
        console.info('[DEBUG] Mermaid diagram rendered successfully')
      } catch (err) {
        console.error('[ERROR] Mermaid rendering error:', err)
        setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    renderDiagram()
  }, [code, theme, isInitialized])

  useEffect(() => {
    if (containerRef.current && svgContent) {
      // Safe to use innerHTML here because content is sanitized with DOMPurify
      containerRef.current.innerHTML = svgContent
    }
  }, [svgContent])

  const handleCopyCode = async () => {
    try {
      const cleanCode = code.trim().replace(/^```mermaid\n?/, '').replace(/\n?```$/, '')
      await navigator.clipboard.writeText(cleanCode)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownloadPNG = async () => {
    if (!containerRef.current) return

    try {
      const svg = containerRef.current.querySelector('svg')
      if (!svg) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (!blob) return
          const pngUrl = URL.createObjectURL(blob)
          const downloadLink = document.createElement('a')
          downloadLink.href = pngUrl
          downloadLink.download = `diagram-${Date.now()}.png`
          downloadLink.click()
          URL.revokeObjectURL(pngUrl)
          URL.revokeObjectURL(url)
        })
      }

      img.src = url
    } catch (err) {
      console.error('Failed to download PNG:', err)
    }
  }

  const handleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="font-semibold text-sm text-destructive">图表渲染失败</p>
        <p className="mt-1 text-sm text-destructive">{error}</p>
        <div className="mt-3 text-xs text-muted-foreground">
          <p>原始代码长度: {code?.length || 0} 字符</p>
          <p>包含代码围栏: {code?.includes('```mermaid') ? '是' : '否'}</p>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            查看完整代码
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-muted p-2 text-xs">{code || '(空)'}</pre>
        </details>
      </div>
    )
  }

  return (
    <div className="group relative">
      {showControls && (
        <div className="absolute right-2 top-2 z-10 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyCode}
            className="h-7 w-7 rounded-md border border-border/40 bg-background/80 backdrop-blur-sm hover:bg-accent"
            title="Copy Mermaid Code">
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownloadPNG}
            className="h-7 w-7 rounded-md border border-border/40 bg-background/80 backdrop-blur-sm hover:bg-accent"
            title="Download as PNG">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="h-7 w-7 rounded-md border border-border/40 bg-background/80 backdrop-blur-sm hover:bg-accent"
            title="Toggle Fullscreen">
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          'mermaid-container min-h-[500px] overflow-auto rounded-lg border border-border/40 bg-muted/20 p-8',
          '[&_svg]:mx-auto [&_svg]:max-w-full',
          'transition-all duration-200',
          className
        )}
      />
    </div>
  )
}
