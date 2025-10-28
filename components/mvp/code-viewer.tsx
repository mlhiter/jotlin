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
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border bg-card flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground text-sm font-medium">Code View</h3>
          <span className="text-muted-foreground text-xs">
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
        <div className="border-border bg-card w-1/4 min-w-48 max-w-72 overflow-y-auto border-r">
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
        <div className="bg-background flex-1 overflow-auto p-4">
          <div className="border-border mb-2 border-b pb-2">
            <span className="text-muted-foreground font-mono text-xs">{selectedFile}</span>
          </div>
          <pre className="text-foreground text-sm">
            <code>{files[selectedFile]}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
