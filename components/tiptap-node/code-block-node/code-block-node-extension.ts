import TiptapCodeBlock from "@tiptap/extension-code-block"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { CodeBlockNode as CodeBlockNodeComponent } from "@/components/tiptap-node/code-block-node/code-block-node"

export const CodeBlock = TiptapCodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeComponent)
  },
})

export default CodeBlock
