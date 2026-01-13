"use client"

import { Pencil, Code } from "lucide-react"
import { useState } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import { MermaidChart } from "@/components/chat/mermaid-chart"

export const CodeBlockNode: React.FC<NodeViewProps> = (props) => {
  const language = props.node.attrs.language || ""
  const isMermaid = language === "mermaid"
  const [showCode, setShowCode] = useState(false)

  if (isMermaid && !showCode) {
    const code = props.node.textContent

    return (
      <NodeViewWrapper className="tiptap-mermaid-codeblock">
        <div className="tiptap-mermaid-controls">
          <Button
            type="button"
            data-style="ghost"
            onClick={() => setShowCode(true)}
            title="Show code"
          >
            <Code className="tiptap-button-icon" />
          </Button>
        </div>

        <div className="tiptap-mermaid-content">
          <MermaidChart code={code} />
        </div>
      </NodeViewWrapper>
    )
  }

  if (isMermaid && showCode) {
    return (
      <NodeViewWrapper className="tiptap-codeblock-editing">
        <div className="tiptap-codeblock-controls">
          <Button
            type="button"
            data-style="ghost"
            onClick={() => setShowCode(false)}
            title="Show diagram"
          >
            <Pencil className="tiptap-button-icon" />
          </Button>
        </div>
        <pre>
          <NodeViewContent as="code" />
        </pre>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="tiptap-codeblock">
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
