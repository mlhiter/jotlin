'use client'

import { NodeViewWrapper } from '@tiptap/react'
import { Copy, Download, Maximize2, Pencil, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRef, useState } from 'react'

import '@/components/tiptap-node/mermaid-node/mermaid-node.scss'
import { MermaidChart } from '@/components/chat/mermaid-chart'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import type { NodeViewProps } from '@tiptap/react'

export const MermaidNode: React.FC<NodeViewProps> = (props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingCode, setEditingCode] = useState(props.node.attrs.code || '')
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  const handleEdit = () => {
    setEditingCode(props.node.attrs.code || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    props.updateAttributes({ code: editingCode })
    setIsEditing(false)
  }

  const handleDelete = () => {
    const pos = props.getPos()
    if (typeof pos === 'number') {
      props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + props.node.nodeSize })
        .run()
    }
  }

  const handleCopyCode = async () => {
    try {
      const code = props.node.attrs.code || ''
      const cleanCode = code
        .trim()
        .replace(/^```mermaid\n?/, '')
        .replace(/\n?```$/, '')
      await navigator.clipboard.writeText(cleanCode)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownloadPNG = async () => {
    const container = containerRef.current?.querySelector('.mermaid-container')
    if (!container) return

    try {
      const svg = container.querySelector('svg')
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
    const container = containerRef.current?.querySelector('.mermaid-container')
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  return (
    <>
      <NodeViewWrapper className="tiptap-mermaid-node">
        <div className="tiptap-mermaid-controls">
          <Button type="button" data-style="ghost" onClick={handleCopyCode} title="Copy code">
            <Copy className="tiptap-button-icon" />
          </Button>
          <Button type="button" data-style="ghost" onClick={handleDownloadPNG} title="Download PNG">
            <Download className="tiptap-button-icon" />
          </Button>
          <Button type="button" data-style="ghost" onClick={handleFullscreen} title="Fullscreen">
            <Maximize2 className="tiptap-button-icon" />
          </Button>
          <div className="tiptap-mermaid-divider" />
          <Button type="button" data-style="ghost" onClick={handleEdit} title="Edit diagram">
            <Pencil className="tiptap-button-icon" />
          </Button>
          <Button type="button" data-style="ghost" onClick={handleDelete} title="Delete diagram">
            <Trash2 className="tiptap-button-icon" />
          </Button>
        </div>

        <div className="tiptap-mermaid-content" ref={containerRef}>
          <MermaidChart code={props.node.attrs.code || ''} showControls={false} />
        </div>
      </NodeViewWrapper>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="flex h-[80vh] w-[80vw] sm:max-w-[80vw] flex-col">
          <DialogHeader>
            <DialogTitle>Edit Mermaid Diagram</DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
            <div className="flex min-h-0 flex-col">
              <label className="mb-2 text-sm font-medium">Mermaid Code</label>
              <Textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="flex-1 resize-none font-mono text-sm"
                placeholder="Enter Mermaid diagram code..."
              />
            </div>

            <div className="flex min-h-0 flex-col">
              <label className="mb-2 text-sm font-medium">Preview</label>
              <div className="bg-muted/20 flex-1 overflow-auto rounded-lg border">
                <MermaidChart code={editingCode} showControls={false} className="min-h-full" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" data-style="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
