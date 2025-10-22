'use client'

import JSZip from 'jszip'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface CodeViewerProps {
  files: Record<string, string>
}

export function CodeViewer({ files }: CodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState(Object.keys(files)[0])
  const [isDownloading, setIsDownloading] = useState(false)
  const fileNames = Object.keys(files).sort()

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
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Code View</h3>
          <span className="text-xs text-muted-foreground">
            {fileNames.length} {fileNames.length === 1 ? 'file' : 'files'}
          </span>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex flex-1 overflow-hidden">
        {/* File List */}
        <div className="w-1/4 max-w-72 min-w-48 overflow-y-auto border-r border-border bg-card">
          <div className="space-y-1 p-2">
            {fileNames.map((fileName) => (
              <button
                key={fileName}
                onClick={() => setSelectedFile(fileName)}
                className={`w-full truncate rounded px-3 py-2 text-left font-mono text-sm transition-colors ${
                  selectedFile === fileName
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                title={fileName}>
                {fileName}
              </button>
            ))}
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-background p-4">
          <div className="mb-2 border-b border-border pb-2">
            <span className="font-mono text-xs text-muted-foreground">{selectedFile}</span>
          </div>
          <pre className="text-sm text-foreground">
            <code>{files[selectedFile]}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
