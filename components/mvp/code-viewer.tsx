'use client'

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import JSZip from 'jszip'
import { Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

import { FileTree } from './file-tree'

interface CodeViewerProps {
  files: Record<string, string>
}

const detectLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    html: 'html',
    xml: 'xml',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    graphql: 'graphql',
    prisma: 'prisma',
  }
  return langMap[ext || ''] || 'plaintext'
}

export function CodeViewer({ files }: CodeViewerProps) {
  const { theme } = useTheme()
  const [selectedFile, setSelectedFile] = useState(Object.keys(files)[0])
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    try {
      const content = files[selectedFile]
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedFile
      a.click()
      URL.revokeObjectURL(url)
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDownloadAll = async () => {
    try {
      setIsDownloading(true)
      toast.info('Compressing files...')

      const zip = new JSZip()

      for (const [path, content] of Object.entries(files)) {
        zip.file(path, content)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'generated-app.zip'
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Project downloaded successfully')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download project')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="bg-background flex h-full overflow-hidden">
      {/* File Tree */}
      <div className="border-border bg-card w-70 shrink-0 border-r">
        <ScrollArea className="h-full pr-1">
          <FileTree files={files} selectedFile={selectedFile} onFileSelect={setSelectedFile} />
        </ScrollArea>
      </div>

      {/* Code Content */}
      <div className="bg-background flex flex-1 flex-col overflow-hidden">
        <div className="border-border bg-card flex shrink-0 items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground truncate font-mono text-xs">{selectedFile}</span>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2" disabled={isDownloading}>
              <Download className="h-3 w-3" />
              Download File
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-2" disabled={isDownloading}>
              <Download className="h-3 w-3" />
              Download All (ZIP)
            </Button>
          </div>
        </div>
        <ScrollAreaPrimitive.Root className="relative flex-1 overflow-hidden">
          <ScrollAreaPrimitive.Viewport className="size-full overflow-scroll">
            <SyntaxHighlighter
              language={detectLanguage(selectedFile)}
              style={theme === 'dark' ? oneDark : oneLight}
              showLineNumbers
              customStyle={{
                margin: 0,
                fontSize: '13px',
                borderRadius: 0,
                background: 'transparent',
              }}
              codeTagProps={{
                style: {
                  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                },
              }}>
              {files[selectedFile] || ''}
            </SyntaxHighlighter>
          </ScrollAreaPrimitive.Viewport>
          <ScrollBar orientation="vertical" />
          <ScrollBar orientation="horizontal" />
          <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
      </div>
    </div>
  )
}
