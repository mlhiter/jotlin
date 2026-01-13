"use client"

import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import "@/components/tiptap-node/mermaid-node/mermaid-node.scss"
import { MermaidChart } from "@/components/chat/mermaid-chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export const MermaidNode: React.FC<NodeViewProps> = (props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingCode, setEditingCode] = useState(props.node.attrs.code || "")

  const handleEdit = () => {
    setEditingCode(props.node.attrs.code || "")
    setIsEditing(true)
  }

  const handleSave = () => {
    props.updateAttributes({ code: editingCode })
    setIsEditing(false)
  }

  const handleDelete = () => {
    const pos = props.getPos()
    if (typeof pos === "number") {
      props.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + props.node.nodeSize })
        .run()
    }
  }

  return (
    <>
      <NodeViewWrapper className="tiptap-mermaid-node">
        <div className="tiptap-mermaid-controls">
          <Button
            type="button"
            data-style="ghost"
            onClick={handleEdit}
            title="Edit diagram"
          >
            <Pencil className="tiptap-button-icon" />
          </Button>
          <Button
            type="button"
            data-style="ghost"
            onClick={handleDelete}
            title="Delete diagram"
          >
            <Trash2 className="tiptap-button-icon" />
          </Button>
        </div>

        <div className="tiptap-mermaid-content">
          <MermaidChart code={props.node.attrs.code || ""} />
        </div>
      </NodeViewWrapper>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Mermaid Diagram</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Mermaid Code
              </label>
              <Textarea
                value={editingCode}
                onChange={(e) => setEditingCode(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                placeholder="Enter Mermaid diagram code..."
              />
            </div>

            <div className="border rounded-lg p-4 bg-muted/20">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <MermaidChart code={editingCode} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              data-style="ghost"
              onClick={() => setIsEditing(false)}
            >
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
