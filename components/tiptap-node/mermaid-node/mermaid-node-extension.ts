import { mergeAttributes, Node } from "@tiptap/react"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { MermaidNode as MermaidNodeComponent } from "@/components/tiptap-node/mermaid-node/mermaid-node"

export interface MermaidNodeOptions {
  /**
   * HTML attributes to add to the mermaid element.
   * @default {}
   */
   
  HTMLAttributes: Record<string, any>
}

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    mermaid: {
      setMermaidNode: (options?: { code?: string }) => ReturnType
    }
  }
}

/**
 * A Tiptap node extension for Mermaid diagrams (flowcharts, sequence diagrams, etc).
 */
export const MermaidNode = Node.create<MermaidNodeOptions>({
  name: "mermaid",

  group: "block",

  draggable: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      code: {
        default: "flowchart TD\n    A[Start] --> B[End]",
        parseHTML: (element) => element.getAttribute("data-code"),
        renderHTML: (attributes) => ({
          "data-code": attributes.code,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "mermaid" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeComponent)
  },

  addCommands() {
    return {
      setMermaidNode:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options || {},
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { selection } = editor.state
        const { nodeAfter } = selection.$from

        if (
          nodeAfter &&
          nodeAfter.type.name === "mermaid" &&
          editor.isActive("mermaid")
        ) {
          return false
        }
        return false
      },
    }
  },
})

export default MermaidNode
